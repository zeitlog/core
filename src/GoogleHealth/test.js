register_roundtrip_modifier("GoogleHealth",function(our_diary,roundtripped_diary,other_format) {
    switch ( other_format.name ) {
    case "Sleepmeter":
    case "SleepAsAndroid":
    case "SleepChart1":
    case "Fitbit":
        [our_diary,roundtripped_diary].forEach(function(diary) {
            diary["records"].forEach( function(record) {
                /*
                 * This format does not support comments or tags.
                 */
                ["comments","tags"].forEach(function(key) {
                    delete record[key];
                });
            });
        });
    }
});


describe("GoogleHealth format", () => {

    var older_start_time = Date.parse("2026-03-02T21:00:00Z"),
        older_end_time = Date.parse("2026-03-03T05:00:00Z"),
        simple_start_time = Date.parse("2026-03-03T20:57:30Z"),
        simple_end_time = Date.parse("2026-03-04T04:41:30Z"),
        fallback_start_time = Date.parse("2026-03-05T01:00:00Z"),
        fallback_end_time = Date.parse("2026-03-05T03:30:00Z")
    ;

    var empty_diary = JSON.stringify({
        "dataPoints": [],
    });

    var simple_google_health_sleep = {
        "name": "users/2515055256096816351/dataTypes/sleep/dataPoints/2724123844716220216",
        "dataSource": {
            "recordingMethod": "DERIVED",
            "device": {
                "displayName": "Charge 6",
            },
            "platform": "FITBIT",
        },
        "sleep": {
            "interval": {
                "startTime": "2026-03-03T20:57:30Z",
                "startUtcOffset": "0s",
                "endTime": "2026-03-04T04:41:30Z",
                "endUtcOffset": "0s",
            },
            "type": "STAGES",
            "metadata": {
                "stagesStatus": "SUCCEEDED",
                "processed": true,
                "main": true,
            },
            "summary": {
                "minutesInSleepPeriod": "464",
                "minutesAfterWakeUp": "0",
                "minutesToFallAsleep": "0",
                "minutesAsleep": "407",
                "minutesAwake": "57",
                "stagesSummary": [
                    {
                        "type": "AWAKE",
                        "minutes": "56",
                        "count": "12",
                    },
                    {
                        "type": "LIGHT",
                        "minutes": "198",
                        "count": "19",
                    },
                    {
                        "type": "DEEP",
                        "minutes": "114",
                        "count": "10",
                    },
                    {
                        "type": "REM",
                        "minutes": "94",
                        "count": "4",
                    },
                ],
            },
        },
    };

    var older_google_health_sleep = {
        "name": "users/2515055256096816351/dataTypes/sleep/dataPoints/older",
        "sleep": {
            "interval": {
                "startTime": "2026-03-02T21:00:00Z",
                "startUtcOffset": "0s",
                "endTime": "2026-03-03T05:00:00Z",
                "endUtcOffset": "0s",
            },
            "type": "CLASSIC",
            "metadata": {
                "nap": false,
            },
            "summary": {
                "minutesInSleepPeriod": "480",
                "minutesAsleep": "430",
                "minutesAwake": "50",
            },
        },
    };

    var fallback_google_health_sleep = {
        "name": "users/2515055256096816351/dataTypes/sleep/dataPoints/fallback",
        "sleep": {
            "interval": {
                "startTime": "2026-03-05T01:00:00Z",
                "startUtcOffset": "0s",
                "endTime": "2026-03-05T03:30:00Z",
                "endUtcOffset": "0s",
            },
            "type": "STAGES",
            "stages": [
                {
                    "startTime": "2026-03-05T01:00:00Z",
                    "endTime": "2026-03-05T02:00:00Z",
                    "type": "ASLEEP",
                },
                {
                    "startTime": "2026-03-05T02:00:00Z",
                    "endTime": "2026-03-05T02:30:00Z",
                    "type": "RESTLESS",
                },
                {
                    "startTime": "2026-03-05T02:30:00Z",
                    "endTime": "2026-03-05T03:30:00Z",
                    "type": "REM",
                },
            ],
        },
    };

    var simple_diary = JSON.stringify({
        "dataPoints": [
            simple_google_health_sleep,
            older_google_health_sleep,
        ],
        "nextPageToken": "",
    });

    var fallback_diary = JSON.stringify({
        "dataPoints": [
            fallback_google_health_sleep,
        ],
    });

    var simple_records = [
        {
            "Id": "users/2515055256096816351/dataTypes/sleep/dataPoints/2724123844716220216",
            "Start Time": simple_start_time,
            "End Time": simple_end_time,
            "Minutes Asleep": 407,
            "Minutes Awake": 57,
            "Number of Awakenings": 12,
            "Time in Bed": 464,
            "Minutes REM Sleep": 94,
            "Minutes Light Sleep": 198,
            "Minutes Deep Sleep": 114,
            "Type": "STAGES",
            "Is Main Sleep": true,
            "Is Nap": false,
            "start": simple_start_time,
            "end": simple_end_time,
        },
        {
            "Id": "users/2515055256096816351/dataTypes/sleep/dataPoints/older",
            "Start Time": older_start_time,
            "End Time": older_end_time,
            "Minutes Asleep": 430,
            "Minutes Awake": 50,
            "Number of Awakenings": null,
            "Time in Bed": 480,
            "Minutes REM Sleep": null,
            "Minutes Light Sleep": null,
            "Minutes Deep Sleep": null,
            "Type": "CLASSIC",
            "Is Main Sleep": false,
            "Is Nap": false,
            "start": older_start_time,
            "end": older_end_time,
        },
    ];

    test_parse({
        file_format: "GoogleHealth",
        name: "Empty diary",
        input: empty_diary,
        expected: {
            "records": [],
        }
    });

    test_parse({
        file_format: "GoogleHealth",
        name: "Simple diary",
        input: simple_diary,
        expected: {
            "records": simple_records,
        }
    });

    test_parse({
        file_format: "GoogleHealth",
        name: "Stage fallback diary",
        input: fallback_diary,
        expected: {
            "records": [
                {
                    "Id": "users/2515055256096816351/dataTypes/sleep/dataPoints/fallback",
                    "Start Time": fallback_start_time,
                    "End Time": fallback_end_time,
                    "Minutes Asleep": 120,
                    "Minutes Awake": 30,
                    "Number of Awakenings": null,
                    "Time in Bed": 150,
                    "Minutes REM Sleep": 60,
                    "Minutes Light Sleep": null,
                    "Minutes Deep Sleep": null,
                    "Type": "STAGES",
                    "Is Main Sleep": false,
                    "Is Nap": false,
                    "start": fallback_start_time,
                    "end": fallback_end_time,
                },
            ],
        }
    });

    test_to({
        name: "Standard Format test",
        format: "Standard",
        input: JSON.stringify({ "dataPoints": [ simple_google_health_sleep ] }),
        expected: [
            {
                "status"  : 'asleep',
                "start"   : simple_start_time,
                "end"     : simple_end_time,
                "duration": simple_end_time - simple_start_time,
                "start_of_new_day": true,
                "day_number"      : 2,
                "is_primary_sleep": true,
            }
        ],
    });

    test_merge({
        name: "Two identical diaries",
        left: simple_diary,
        right: simple_diary,
        expected: {
            "records": simple_records,
        },
    });

    test_merge({
        name: "Left empty, right non-empty",
        left: empty_diary,
        right: simple_diary,
        expected: {
            "records": simple_records,
        },
    });

    it("converts Google Health's newest-first API response to chronological Standard records", function() {
        var standard_records = new_sleep_diary(simple_diary)["to"]("Standard")["records"];
        expect(standard_records.map( record => record["start"] ))["toEqual"]([
            older_start_time,
            simple_start_time,
        ]);
    });

});
