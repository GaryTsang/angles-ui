import React, { useEffect, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import queryString from 'query-string';
import { useLocation, useNavigate } from 'react-router-dom';
import { MetricRequests } from 'angles-javascript-client';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import {
  Affix,
  DateRangePicker,
  SelectPicker,
  Stack,
  Form,
  Button,
} from 'rsuite';
import MetricsResultChart from '../../charts/MetricsResultChart';
import TestPhasesChart from '../../charts/TestPhasesChart';
import PlatformDistributionChart from '../../charts/PlatformDistributionChart';
import ExecutionMetricsSummary from '../../tables/ExecutionMetricsSummary';
import PlatformDistributionPieChart from '../../charts/PlatformDistributionPieChart';
// import './Default.css';
import PlatformMetricsSummary from '../../tables/PlatformMetricsSummary';
import { getRandomColor } from '../../../utility/ChartUtilities';

const MetricsPage = function (props) {
  const navigate = useNavigate();
  const location = useLocation();
  const query = queryString.parse(location.search);
  const { teams, currentTeam } = props;
  const {
    component,
    grouping,
    startDate: queryStartDate,
    endDate: queryEndDate,
  } = query;
  const [startDate, setStartDate] = useState(queryStartDate ? moment(queryStartDate) : moment().subtract(30, 'days'));
  const [endDate, setEndDate] = useState(queryEndDate ? moment(queryEndDate) : moment());
  const [groupingPeriod, setGroupingPeriod] = useState(grouping || 'week');
  const [selectedTeam, setSelectedTeam] = useState(currentTeam._id);
  const [selectedComponent, setSelectedComponent] = useState(component || 'any');
  const [key, setKey] = useState('execution');
  const [metrics, setMetrics] = useState({});
  const [platformColors, setPlatformColors] = useState({});
  const metricRequests = new MetricRequests(axios);
  const { afterToday } = DateRangePicker;

  const getPlatformArrayColors = (metricsToUse) => {
    const result = { colors: [] };
    metricsToUse.periods.forEach((period) => {
      period.phases.forEach((phase) => {
        phase.executions.forEach((execution) => {
          if (execution.platforms && execution.platforms.length > 0) {
            execution.platforms.forEach((platform) => {
              if (!result[platform.platformName]) {
                const color = getRandomColor(1)[0];
                result[platform.platformName] = { color };
                result.colors.push(color);
              }
            });
          }
        });
      });
    });
    return result;
  };

  const getMetrics = (teamId, componentId, fromDate, toDate, groupingId) => {
    if (metrics && metrics !== {}) {
      setMetrics(undefined);
    }
    metricRequests.getPhaseMetrics(teamId, componentId, fromDate, toDate, groupingId)
      .then((returnedMetrics) => {
        setMetrics(returnedMetrics);
        setPlatformColors(getPlatformArrayColors(returnedMetrics));
      })
      .catch(() => {
        setMetrics({});
        setPlatformColors({});
      });
  };

  const retrieveMetrics = () => {
    if (endDate && startDate) {
      if (selectedComponent === 'any') {
        getMetrics(selectedTeam, undefined, startDate, endDate, groupingPeriod);
      } else {
        getMetrics(selectedTeam, selectedComponent, startDate, endDate, groupingPeriod);
      }
    }
  };

  useEffect(() => {
    retrieveMetrics();
  }, []);

  // const handleDatesChange = ({ startDate, endDate }) => {
  //   setStartDate(startDate);
  //   setEndDate(endDate);
  // };

  const handleGroupingChange = (groupingValue) => {
    setGroupingPeriod(groupingValue);
  };

  const handleTeamChange = (teamId) => {
    const { changeCurrentTeam } = props;
    changeCurrentTeam(teamId);
    setSelectedTeam(teamId);
    setSelectedComponent('any');
  };

  const handleComponentChange = (componentId) => {
    setSelectedComponent(componentId);
  };

  const handleSelect = (value) => {
    if (['execution', 'platform'].includes(value)) {
      setKey(value);
    }
  };

  const setTab = (keyToSelect) => {
    handleSelect(keyToSelect);
  };

  const onSubmit = () => {
    const params = {
      teamId: selectedTeam,
      component: selectedComponent,
      grouping: groupingPeriod,
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
    };
    // setting the url so people can copy it.
    navigate({
      pathname: '/metrics',
      search: `?${new URLSearchParams(params).toString()}`,
    });
    retrieveMetrics();
  };

  const getComponents = (teamId) => {
    const teamFound = teams.find((team) => team._id === teamId);
    return teamFound.components;
  };

  return (
    <div>
      <Affix>
        <Stack className="rg-stack" spacing={10}>
          <Form>
            <SelectPicker
              cleanable={false}
              // searchable={false}
              appearance="subtle"
              data={teams.map((team) => ({ label: team.name, value: team._id }))}
              value={selectedTeam}
              onChange={(value) => {
                if (value) {
                  handleTeamChange(value);
                }
              }}
            />
            <SelectPicker
              cleanable
              // searchable={false}
              appearance="subtle"
              data={getComponents(selectedTeam)
                .map((teamComponent) => ({ label: teamComponent.name, value: teamComponent._id }))}
              value={selectedComponent}
              onChange={(value) => {
                if (value) {
                  handleComponentChange(value);
                }
              }}
              onClean={() => {
                setSelectedComponent(undefined);
              }}
            />
            <DateRangePicker
              value={[startDate.toDate(), endDate.toDate()]}
              format="dd-MMM-yyyy"
              character=" - "
              onChange={(value) => {
                setStartDate(moment(value[0]));
                setEndDate(moment(value[1]));
              }}
              shouldDisableDate={afterToday()}
              cleanable={false}
            />
            <SelectPicker
              cleanable={false}
              // searchable={false}
              appearance="subtle"
              data={[
                { label: 'Day', value: 'day' },
                { label: 'Week', value: 'week' },
                { label: 'Fortnight', value: 'fortnight' },
                { label: 'Month', value: 'month' },
                { label: 'Year', value: 'year' },
              ]}
              value={groupingPeriod}
              onChange={(value) => {
                if (value) {
                  handleGroupingChange(value);
                }
              }}
            />
            <Button variant="primary" type="button" className="metrics-button" onClick={() => { onSubmit(); }}>Retrieve Metrics</Button>
          </Form>
        </Stack>
      </Affix>
      <div className="metrics-data-container">
        <Tabs id="execution-metrics-tabs" activeKey={key} defaultActiveKey="execution" onSelect={(tabKey, evt) => setTab(tabKey, evt)}>
          <Tab eventKey="execution" title="Execution Metrics">
            <div className="metrics-surround">
              <div style={{ display: !metrics ? 'block' : 'none' }} className="alert alert-primary" role="alert">
                <span>
                  <i className="fas fa-spinner fa-pulse fa-2x" />
                  <span> Retrieving metrics.</span>
                </span>
              </div>
              <div style={{ display: (metrics && Object.keys(metrics).length === 0) ? 'block' : 'none' }} className="alert alert-danger" role="alert">
                <span>Unable to retrieve metrics. Please refresh the page and try again.</span>
              </div>
              {
                metrics && Object.keys(metrics).length > 0 ? (
                  <div style={{ display: (metrics && Object.keys(metrics).length > 0) ? 'block' : 'none' }}>
                    <div className="metrics-table-div">
                      <ExecutionMetricsSummary metrics={metrics} />
                    </div>
                    <div className="graphContainerParent">
                      <MetricsResultChart metrics={metrics} />
                      <TestPhasesChart metrics={metrics} />
                    </div>
                  </div>
                ) : null
              }
            </div>
          </Tab>
          <Tab eventKey="platform" title="Platform Metrics">
            <div className="metrics-surround">
              <div style={{ display: !metrics ? 'block' : 'none' }} className="alert alert-primary" role="alert">
                <span>
                  <i className="fas fa-spinner fa-pulse fa-2x" />
                  <span> Retrieving metrics.</span>
                </span>
              </div>
              <div style={{ display: (metrics && Object.keys(metrics).length === 0) ? 'block' : 'none' }} className="alert alert-danger" role="alert">
                <span>Unable to retrieve metrics. Please refresh the page and try again.</span>
              </div>
              {
                metrics && Object.keys(metrics).length > 0 ? (
                  <div style={{ display: (metrics && Object.keys(metrics).length > 0) ? 'block' : 'none' }}>
                    <div className="metrics-table-div">
                      <PlatformMetricsSummary metrics={metrics} platformColors={platformColors} />
                    </div>
                    <div className="graphContainerParent">
                      <PlatformDistributionPieChart
                        metrics={metrics}
                        platformColors={platformColors}
                      />
                      <PlatformDistributionChart
                        metrics={metrics}
                        platformColors={platformColors}
                      />
                    </div>
                  </div>
                ) : null
              }
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default MetricsPage;
