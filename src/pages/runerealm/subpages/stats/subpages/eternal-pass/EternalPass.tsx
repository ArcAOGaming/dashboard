import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CreditNoticeService, type CreditNotice,  PROCESS_IDS } from 'ao-process-clients';
import type { Data, Layout } from 'plotly.js';
import Plot from 'react-plotly.js';
import './EternalPass.css';

const PAYMENT_METHODS = [
  { name: 'Trunk', id: PROCESS_IDS.COMMUNITY_TOKENS.TRUNK },
  { name: 'NAB', id: PROCESS_IDS.COMMUNITY_TOKENS.NUMBER_ALWAYS_BIGGER },
  { name: 'wAR', id: PROCESS_IDS.DEFI.WRAPPED_ARWEAVE },
] as const;

type PaymentMethodId = typeof PAYMENT_METHODS[number]['id'];

interface AggregatedCreditNotice {
  timestamp: number;
  amount: number;
  cumulativeAmount: number;
  source: string;
}

export const EternalPass: React.FC = () => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodId>(PAYMENT_METHODS[0].id);
  const [creditNotices, setCreditNotices] = useState<AggregatedCreditNotice[]>([]);
  const [rawCreditNotices, setRawCreditNotices] = useState<CreditNotice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastQueryTime, setLastQueryTime] = useState<Record<string, number>>({});
  const [aggregatedExpanded, setAggregatedExpanded] = useState(false);
  const [rawExpanded, setRawExpanded] = useState(false);

  const fetchCreditNotices = useCallback(async (paymentMethodId: string, forceRefresh = false) => {
    const currentTime = Date.now();

    // Check if we have cached data and it's not a forced refresh
    if (!forceRefresh && lastQueryTime[paymentMethodId] &&
      currentTime - lastQueryTime[paymentMethodId] < 24 * 60 * 60 * 1000) {
      // Use cached data
      return;
    }

    setIsLoading(true);
    setCreditNotices([]); // Clear only if we're actually fetching
    setRawCreditNotices([]);
    try {
      const service = CreditNoticeService.autoConfiguration()
      let notices: CreditNotice[] = [];

      notices = await service.getCreditNoticesFromProcess(
        PROCESS_IDS.RUNEREALM.PAYMENTS,
        paymentMethodId
      );

      // Sort by timestamp and calculate cumulative amount
      const sortedNotices = notices.sort((a, b) => a.blockTimeStamp - b.blockTimeStamp);
      let runningTotal = 0;

      // Store raw notices
      setRawCreditNotices(sortedNotices);

      // Create aggregated notices for the plot
      const formattedNotices = sortedNotices.map(notice => {
        const amount = parseFloat(notice.quantity);
        runningTotal += amount;
        return {
          timestamp: notice.blockTimeStamp,
          amount,
          cumulativeAmount: runningTotal,
          source: notice.fromProcess
        };
      });

      setCreditNotices(formattedNotices);
      setLastQueryTime(prev => ({ ...prev, [paymentMethodId]: currentTime }));
    } catch (error) {
      console.error('Error fetching credit notices:', error);
    } finally {
      setIsLoading(false);
    }
  }, [lastQueryTime]);

  useEffect(() => {
    fetchCreditNotices(selectedPaymentMethod);
  }, [selectedPaymentMethod, fetchCreditNotices]);

  const plotData: Data[] = useMemo(() => {
    return [{
      x: creditNotices.map(notice => {
        // Convert milliseconds to seconds if needed
        const timestamp = notice.timestamp > 1e12 ? notice.timestamp : notice.timestamp * 1000;
        return new Date(timestamp);
      }),
      y: creditNotices.map(notice => notice.cumulativeAmount),
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: '#1a1a1a', width: 2 },
      marker: {
        color: '#1a1a1a',
        size: 8,
        symbol: 'diamond'
      }
    }];
  }, [creditNotices]);

  const plotLayout: Partial<Layout> = {
    title: {
      text: `${PAYMENT_METHODS.find(m => m.id === selectedPaymentMethod)?.name} Token Deposits Over Time`,
      font: {
        family: 'Arial, sans-serif',
        size: 24,
        color: '#1a1a1a'
      }
    },
    xaxis: {
      title: {
        text: 'Date of Purchase (UTC)',
        font: {
          size: 18,
          color: '#1a1a1a'
        },
        standoff: 40
      },
      tickformat: '%Y-%m-%d %H:%M:%S',
      color: '#1a1a1a',
      gridcolor: '#e0e0e0',
      zerolinecolor: '#1a1a1a',
      showgrid: true,
      zeroline: true,
      linecolor: '#1a1a1a',
      tickangle: 45
    },
    yaxis: {
      title: {
        text: `Total ${PAYMENT_METHODS.find(m => m.id === selectedPaymentMethod)?.name} Tokens Deposited`,
        font: {
          size: 18,
          color: '#1a1a1a'
        },
        standoff: 40
      },
      color: '#1a1a1a',
      gridcolor: '#e0e0e0',
      zerolinecolor: '#1a1a1a',
      showgrid: true,
      zeroline: true,
      linecolor: '#1a1a1a'
    },
    paper_bgcolor: 'white',
    plot_bgcolor: 'white',
    font: {
      family: 'Arial, sans-serif',
      color: '#1a1a1a'
    },
    showlegend: false,
    margin: {
      l: 120,
      r: 30,
      t: 50,
      b: 100
    },
    autosize: true
  };

  const selectedPaymentMethodName = PAYMENT_METHODS.find(m => m.id === selectedPaymentMethod)?.name;

  return (
    <div className="eternal-pass-container">
      <h2 className="eternal-pass-title">Eternal Pass Purchases</h2>
      <div className="eternal-pass-content">
        <div className="stats-controls">
          <select
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethodId)}
            className="stats-select"
          >
            {PAYMENT_METHODS.map(method => (
              <option key={method.id} value={method.id}>
                {method.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchCreditNotices(selectedPaymentMethod, true)}
            className="stats-refresh-button"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>

        <div className="stats-plot">
          <Plot
            data={plotData}
            layout={{
              ...plotLayout,
              height: window.innerWidth < 768 ? 400 : 600,
              xaxis: {
                ...plotLayout.xaxis,
                tickangle: window.innerWidth < 768 ? 90 : 45,
              },
              margin: {
                l: window.innerWidth < 768 ? 50 : 120,
                r: window.innerWidth < 768 ? 20 : 30,
                t: 50,
                b: window.innerWidth < 768 ? 120 : 100,
              }
            }}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
          />
        </div>

        <div className="table-section">
          <div
            className="table-header"
            onClick={() => setAggregatedExpanded(!aggregatedExpanded)}
          >
            <div className={`collapse-icon ${aggregatedExpanded ? 'expanded' : ''}`}>
              ▶
            </div>
            <h3 className="eternal-pass-subtitle">Aggregated Data</h3>
          </div>
          <div className={`table-content ${aggregatedExpanded ? 'expanded' : ''}`}>
            <div className="table-container">
              {isLoading ? (
                <div className="loading-message">Loading aggregated data...</div>
              ) : creditNotices.length === 0 ? (
                <div className="no-data-message">No data available for {selectedPaymentMethodName}</div>
              ) : (
                <table className="raw-data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Cumulative Amount</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditNotices.map((notice, index) => (
                      <tr key={index}>
                        <td>
                          {new Date(notice.timestamp > 1e12 ? notice.timestamp : notice.timestamp * 1000).toLocaleString()}
                        </td>
                        <td>{notice.amount.toFixed(2)}</td>
                        <td>{notice.cumulativeAmount.toFixed(2)}</td>
                        <td>{notice.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="table-section">
          <div
            className="table-header"
            onClick={() => setRawExpanded(!rawExpanded)}
          >
            <div className={`collapse-icon ${rawExpanded ? 'expanded' : ''}`}>
              ▶
            </div>
            <h3 className="eternal-pass-subtitle">Raw Credit Notices</h3>
          </div>
          <div className={`table-content ${rawExpanded ? 'expanded' : ''}`}>
            <div className="table-container">
              {isLoading ? (
                <div className="loading-message">Loading raw credit notices...</div>
              ) : rawCreditNotices.length === 0 ? (
                <div className="no-data-message">No data available for {selectedPaymentMethodName}</div>
              ) : (
                <table className="raw-data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Recipient</th>
                      <th>Quantity</th>
                      <th>Sender</th>
                      <th>From Process</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawCreditNotices.map((notice) => (
                      <tr key={notice.id}>
                        <td>{notice.id}</td>
                        <td>{notice.recipient}</td>
                        <td>{notice.quantity}</td>
                        <td>{notice.sender}</td>
                        <td>{notice.fromProcess}</td>
                        <td>{new Date(notice.blockTimeStamp > 1e12 ? notice.blockTimeStamp : notice.blockTimeStamp * 1000).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
