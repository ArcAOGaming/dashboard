import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CreditNoticeService, type CreditNotice, TOKENS, processIds } from 'ao-process-clients';
import type { Data, Layout } from 'plotly.js';
import Plot from 'react-plotly.js';
import './EternalPass.css';

const PAYMENT_METHODS = [
  { name: 'Trunk', id: TOKENS.TRUNK },
  { name: 'NAB', id: TOKENS.NUMBER_ALWAYS_BIGGER },
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
  const [isLoading, setIsLoading] = useState(false);
  const [lastQueryTime, setLastQueryTime] = useState<Record<string, number>>({});

  const fetchCreditNotices = useCallback(async (paymentMethodId: string, forceRefresh = false) => {
    const currentTime = Date.now();
    if (!forceRefresh && lastQueryTime[paymentMethodId] &&
      currentTime - lastQueryTime[paymentMethodId] < 24 * 60 * 60 * 1000) {
      return; // Use cached data if less than 24 hours old
    }

    setIsLoading(true);
    try {
      const service = new CreditNoticeService();
      let notices: CreditNotice[] = [];

      notices = await service.getCreditNoticesFromProcess(
        processIds.RUNE_REALM_PAYMENTS_PROCESS_ID,
        paymentMethodId
      );

      // Sort by timestamp and calculate cumulative amount
      const sortedNotices = notices.sort((a, b) => a.ingestedAt - b.ingestedAt);
      let runningTotal = 0;

      const formattedNotices = sortedNotices.map(notice => {
        const amount = parseFloat(notice.quantity);
        runningTotal += amount;
        return {
          timestamp: notice.ingestedAt,
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
  }, [creditNotices, selectedPaymentMethod]);

  const plotLayout: Partial<Layout> = {
    title: {
      text: `${selectedPaymentMethod === TOKENS.TRUNK ? 'Trunk' : 'NAB'} Token Deposits Over Time`,
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
        text: `Total ${selectedPaymentMethod === TOKENS.TRUNK ? 'Trunk' : 'NAB'} Tokens Deposited`,
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
            layout={plotLayout}
            style={{ width: '100%', height: '600px' }}
          />
        </div>
      </div>
    </div>
  );
};
