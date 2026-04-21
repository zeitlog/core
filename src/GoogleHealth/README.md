# Google Health format

[Google Health API](https://developers.google.com/health) is the successor API for Fitbit Web API integrations.  It exposes Fitbit and other health data through Google OAuth and a unified set of data types.

## In this directory

You may find the following useful:

- [JavaScript example code](engine.js)
- [Test cases](test.js)

## Import format

The parser supports JSON responses from the Google Health API sleep data point list endpoint:

```text
GET https://health.googleapis.com/v4/users/me/dataTypes/sleep/dataPoints
```

The expected response contains a `dataPoints` array.  Each sleep data point includes a `sleep.interval` with RFC 3339 `startTime` and `endTime` values, plus optional sleep summaries and sleep stage segments.

Sleep Diary uses the Google Health interval start and end times as the canonical session boundaries.  Summary minute fields are preserved as source metrics, but they are not used to shift the session on the chart.
