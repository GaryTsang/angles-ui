import React, { useContext } from 'react';
import { FormattedMessage } from 'react-intl';
import { Container } from 'react-bootstrap';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Moment from 'react-moment';
import CurrentScreenshotContext from '../../../../context/CurrentScreenshotContext';
import Message from '../../Message';

const ScreenshotHistoryView = function (props) {
  const {
    isBaseline,
  } = props;
  const {
    currentScreenshotDetails,
    currentScreenshotHistory,
    currentBaseLineDetails,
  } = useContext(CurrentScreenshotContext);

  const isSelectedId = (screenshotId) => {
    if (currentScreenshotDetails && currentScreenshotDetails._id === screenshotId) {
      return true;
    }
    return false;
  };

  const grabThumbnail = (screenshot) => {
    if (screenshot.thumbnail.startsWith('data:image')) {
      return screenshot.thumbnail;
    }
    return `data:image/png;base64, ${screenshot.thumbnail}`;
  };

  const doesArrayContainImage = (screenshotArray, screenshotToLookFor) => {
    const filterScreenshot = screenshotArray
      .filter((screenshot) => screenshot._id === screenshotToLookFor._id);
    if (filterScreenshot.length > 0) {
      return true;
    }
    return false;
  };

  const getScreenshotArray = () => {
    // ensure that the baseline is added if not in the history.
    const screenshotArray = currentScreenshotHistory.map((screenshot) => ({ ...screenshot }));
    if (currentBaseLineDetails && !doesArrayContainImage(
      screenshotArray,
      currentBaseLineDetails.screenshot,
    )) {
      screenshotArray.push(currentBaseLineDetails.screenshot);
    }
    return screenshotArray;
  };

  return (
    (currentScreenshotHistory == null) ? (
      <Message
        type="info"
        message={(
          <span>
            <i className="fas fa-spinner fa-pulse fa-2x" />
            <FormattedMessage id="common.component.screenshot-view.tabs.history.message.loading-history" />
          </span>
        )}
      />
    ) : (
      <Container className="card-deck-history">
        {getScreenshotArray().map((screenshot) => [
          <Card key={screenshot._id} className={`screenshotCard ${isSelectedId(screenshot._id) ? 'card-active' : ''}`}>
            {
              isBaseline(screenshot._id) ? (
                <div className="card-img-overlay baseline-overlay">
                  <p>
                    <FormattedMessage id="common.component.screenshot-view.tabs.history.label.baseline" />
                  </p>
                </div>
              ) : null
            }
            { !isSelectedId(screenshot._id) ? (
              <a title="Go to screenshot" href={`/test-run?buildId=${screenshot.build}&loadScreenshotId=${screenshot._id}`}>
                <Card.Img className="card-image-history" variant="top" src={`${grabThumbnail(screenshot)}`} />
              </a>
            ) : <Card.Img className="card-image-history" variant="top" src={`${grabThumbnail(screenshot)}`} /> }
            <Card.Body>
              <Card.Footer>
                <div>
                  <Table className="table-screenshot-history-details" bordered size="sm">
                    <tbody>
                      <tr>
                        <td>
                          <span className="card-label">
                            <FormattedMessage id="common.component.screenshot-view.tabs.history.label.view" />
                          </span>
                          <span>: </span>
                          <span>{` ${screenshot.view}`}</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span className="card-label">
                            <FormattedMessage id="common.component.screenshot-view.tabs.history.label.date" />
                          </span>
                          <span>: </span>
                          <Moment utc format="DD-MM-YYYY HH:mm:ss">
                            {screenshot.timestamp}
                          </Moment>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span className="card-label">
                            <FormattedMessage id="common.component.screenshot-view.tabs.history.label.resolution" />
                          </span>
                          <span>: </span>
                          <span>{`${screenshot.width} x ${screenshot.height}`}</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span className="card-label">
                            <FormattedMessage id="common.component.screenshot-view.tabs.history.label.platform" />
                          </span>
                          <span>: </span>
                          { screenshot.platform ? (screenshot.platform.platformName) : '' }
                          { screenshot.platform && screenshot.platform.platformVersion ? (screenshot.platform.platformVersion) : '' }
                          { screenshot.platform && screenshot.platform.browserName ? (` (${screenshot.platform.browserName}${screenshot.platform.browserVersion ? (` ${screenshot.platform.browserVersion}`) : ''})`) : '' }
                        </td>
                      </tr>
                      {
                        screenshot.platform && screenshot.platform.deviceName ? (
                          <tr>
                            <td>
                              <span className="card-label">
                                <FormattedMessage id="common.component.screenshot-view.tabs.history.label.device" />
                              </span>
                              <span>: </span>
                              {` ${screenshot.platform.deviceName} `}
                            </td>
                          </tr>
                        ) : null
                      }
                    </tbody>
                  </Table>
                </div>
              </Card.Footer>
            </Card.Body>
          </Card>,
        ])}
      </Container>
    )
  );
};

export default ScreenshotHistoryView;
