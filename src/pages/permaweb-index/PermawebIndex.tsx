import { useEffect, useState } from 'react';
import { PiDataService } from 'ao-process-clients/dist/src/services/autonomous-finance/pi-data-service';
import { toArray } from 'rxjs/operators';
import type { DelegationPreferencesResponseWithBalance } from 'ao-process-clients/dist/src/services/autonomous-finance/pi-data-service/abstract/responses';
import Plot from 'react-plotly.js';
import { Data } from 'plotly.js';
import './PermawebIndex.css';

import { DelegationInfo, ProjectDelegationTotal } from 'ao-process-clients';

export const PermawebIndex = () => {
  const [delegationInfo, setDelegationInfo] = useState<DelegationPreferencesResponseWithBalance[]>([]);
  const [projectDelegations, setProjectDelegations] = useState<{projectId: string, amount: string}[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const piService = await PiDataService.autoConfiguration();
        
        // Subscribe to the observable
        const subscription = piService.getAllPiDelegationPreferencesWithBalances()
          .pipe(toArray())
          .subscribe({
            next: (data) => {
              if (!mounted) return;
              
              // Flatten the array of arrays into a single array
              const flattenedData = data.flat();
              setDelegationInfo(flattenedData);
              
              // Transform data into project totals
              const projectTotals = Object.entries(flattenedData.reduce((acc, account) => {
                account.delegationPrefs.forEach(d => {
                  const amount = (d.factor * account.balance / 1000000000000); // Convert Winston to AR
                  acc[d.walletTo] = (acc[d.walletTo] || 0) + amount;
                });
                return acc;
              }, {} as Record<string, number>)).map(([projectId, amount]) => ({
                projectId,
                amount: amount.toString()
              }));
              
              setProjectDelegations(projectTotals);
              if (projectTotals.length > 0) {
                setSelectedProcessId(projectTotals[0].projectId);
              }
            },
            error: (error) => {
              console.error('Error fetching PI data:', error);
              setLoading(false);
            },
            complete: () => {
              if (mounted) {
                setLoading(false);
              }
            }
          });
        
        // Cleanup subscription
        return () => {
          subscription.unsubscribe();
          mounted = false;
        };
      } catch (error) {
        console.error('Error fetching PI data:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  const handleProcessIdChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProcessId(event.target.value);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const balanceChartData: Partial<Data> = {
    values: projectDelegations.map(d => parseFloat(d.amount) || 0),
    labels: projectDelegations.map(d => truncateAddress(d.projectId)),
    type: 'pie' as const,
    textinfo: 'label+percent',
    hovertemplate: '%{label}<br>Balance: %{value:.2f} AR<extra></extra>'
  };

  const delegationChartData: Partial<Data> = {
    values: delegationInfo
      .filter(info => info.delegationPrefs.some(d => d.walletTo === selectedProcessId))
      .map(info => info.balance / 1000000000000), // Convert Winston to AR
    labels: delegationInfo
      .filter(info => info.delegationPrefs.some(d => d.walletTo === selectedProcessId))
      .map(info => truncateAddress(info.wallet)),
    type: 'pie' as const,
    textinfo: 'label+percent',
    hovertemplate: '%{label}<br>Balance: %{value:.2f} AR<extra></extra>'
  };

  if (loading) {
    return <div className="content-wrapper">Loading...</div>;
  }

  return (
    <div className="content-wrapper">
      <h1>Permaweb Index</h1>
      
      <section className="chart-section">
        <h2>Total Delegated AO by Process</h2>
        <div className="chart-container">
          <Plot
            data={[balanceChartData]}
            layout={{
              width: undefined,
              height: 500,
              showlegend: true,
              legend: { orientation: 'h' },
              margin: { t: 30, b: 30, l: 30, r: 30 },
              paper_bgcolor: 'white',
              plot_bgcolor: 'white',
              font: {
                family: 'Arial, sans-serif',
                color: '#1a1a1a'
              }
            }}
            style={{ width: '100%' }}
            useResizeHandler={true}
          />
        </div>
      </section>

      <section className="chart-section">
        <h2>Delegator Balances for Selected Process</h2>
        <div className="process-selector">
          <label htmlFor="processId">Select Process ID:</label>
          <select 
            id="processId" 
            value={selectedProcessId} 
            onChange={handleProcessIdChange}
          >
            {projectDelegations.map(project => (
              <option key={project.projectId} value={project.projectId}>
                {truncateAddress(project.projectId)}
              </option>
            ))}
          </select>
        </div>
        <div className="chart-container">
          <Plot
            data={[delegationChartData]}
            layout={{
              width: undefined,
              height: 500,
              showlegend: true,
              legend: { orientation: 'h' },
              margin: { t: 30, b: 30, l: 30, r: 30 },
              paper_bgcolor: 'white',
              plot_bgcolor: 'white',
              font: {
                family: 'Arial, sans-serif',
                color: '#1a1a1a'
              }
            }}
            style={{ width: '100%' }}
            useResizeHandler={true}
          />
        </div>
      </section>
    </div>
  );
};
