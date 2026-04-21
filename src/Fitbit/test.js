register_roundtrip_modifier("Fitbit",function(our_diary,roundtripped_diary,other_format) {
    switch ( other_format.name ) {
    case "Sleepmeter":
    case "SleepAsAndroid":
    case "SleepChart1":
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


describe("Fitbit format", () => {

    var empty_diary
        = "Sleep\n"
        + "Start Time,End Time,Minutes Asleep,Minutes Awake,Number of Awakenings,Time in Bed,Minutes REM Sleep,Minutes Light Sleep,Minutes Deep Sleep\n" +
        "\n"
    ;

    var simple_diary = (
        "Sleep\n" +
        "Start Time,End Time,Minutes Asleep,Minutes Awake,Number of Awakenings,Time in Bed,Minutes REM Sleep,Minutes Light Sleep,Minutes Deep Sleep\n" +
        '"2010-11-12 1:23AM","2010-11-12 2:34PM","700","91","1","12","123","1,234","12,345"\n' +
        "\n"
    );

    var simple_end_time = new Date(2010, 10, 12, 14, 34, 0, 0).getTime();
    var  other_end_time = new Date(2012, 10, 10, 16, 32, 0, 0).getTime();
    var duration = ( 700 + 91 ) * 60*1000;
    var simple_start_time = simple_end_time - duration;

    var api_sleep_entry = {
        "dateOfSleep": "2010-11-12",
        "startTime": "2010-11-12T01:23:00.000",
        "endTime": "2010-11-12T14:34:00.000",
        "duration": duration,
        "minutesToFallAsleep": 0,
        "minutesAfterWakeup": 0,
        "minutesAsleep": 700,
        "minutesAwake": 91,
        "awakeCount": 1,
        "timeInBed": 12,
        "type": "stages",
        "levels": {
            "summary": {
                "deep": { "minutes": 12345 },
                "light": { "minutes": 1234 },
                "rem": { "minutes": 123 },
                "wake": { "minutes": 91 },
            },
        },
    };

    var api_diary = JSON.stringify({
        "sleep": [ api_sleep_entry ],
    });

    var api_diary_with_bedtime_offsets = JSON.stringify({
        "sleep": [
            Object.assign({},api_sleep_entry,{
                "startTime": "2010-11-12T00:58:00.000",
                "duration": ( 700 + 91 + 25 + 40 ) * 60*1000,
                "minutesToFallAsleep": 25,
                "minutesAfterWakeup": 40,
                "timeInBed": 700 + 91 + 25 + 40,
            }),
        ],
    });

    var fitsaver_diary = JSON.stringify({
        "format": "https://fitsaver.github.io/formats#date_range",
        "results": {
            "sleep": {
                "sleep": [ api_sleep_entry ],
            },
            "sleep/list": {
                "sleep": [ api_sleep_entry ],
            },
        },
    });

    var fitbit_n24_diary = JSON.stringify({
        "sleep": [
            {
                "dateOfSleep": "2010-11-12",
                "startTime": new Date(simple_start_time).toISOString(),
                "endTime": new Date(simple_end_time).toISOString(),
                "durationMs": duration,
                "durationHours": duration / (60*60*1000),
                "efficiency": 98,
                "minutesAsleep": 700,
                "minutesAwake": 91,
                "isMainSleep": true,
                "stages": {
                    "deep": 12345,
                    "light": 1234,
                    "rem": 123,
                    "wake": 91,
                },
            }
        ],
    });

    var archive_json_diary = JSON.stringify({
        "StartDate": "2010-11-12T01:23:00.000",
        "EndDate": "2010-11-12T14:34:00.000",
        "Duration": duration,
        "MinutesToFallAsleep": 0,
        "MinutesAfterWakeup": 0,
        "MinutesAsleep": 700,
        "MinutesAwake": 91,
        "AwakeCount": 1,
        "TimeInBed": 12,
        "Type": "stages",
        "SleepLevelRem": 123,
        "SleepLevelLight": 1234,
        "SleepLevelDeep": 12345,
        "SleepLevelWake": 91,
    });

    var simple_records = [
        {
            "Minutes Asleep": 700,
            "Minutes Awake": 91,
            "Number of Awakenings": 1,
            "Time in Bed": 12,
            "Minutes REM Sleep": 123,
            "Minutes Light Sleep": 1234,
            "Minutes Deep Sleep": 12345,
            "End Time": simple_end_time,
            "end"     : simple_end_time,
            "Start Time": simple_end_time - duration,
            "start"     : simple_end_time - duration,
        }
    ];

    var fitbit_n24_records = [
        {
            "Minutes Asleep": 700,
            "Minutes Awake": 91,
            "Number of Awakenings": null,
            "Time in Bed": 791,
            "Minutes REM Sleep": 123,
            "Minutes Light Sleep": 1234,
            "Minutes Deep Sleep": 12345,
            "End Time": simple_end_time,
            "end"     : simple_end_time,
            "Start Time": simple_end_time - duration,
            "start"     : simple_end_time - duration,
        }
    ];

    var api_diary_with_bedtime_offsets_records = [
        Object.assign({},simple_records[0],{
            "Time in Bed": 700 + 91 + 25 + 40,
        }),
    ];

    test_parse({
        file_format: "Fitbit",
        name: "Empty diary",
        input: empty_diary,
        expected: {
            "records": [],
        }
    });

    test_parse({
        file_format: "Fitbit",
        name: "Simple diary",
        input: simple_diary,
        expected: {
            "records": simple_records,
        }
    });

    test_parse({
        file_format: "Fitbit",
        name: "Fitbit API diary",
        input: api_diary,
        expected: {
            "records": simple_records,
        }
    });

    test_parse({
        file_format: "Fitbit",
        name: "Fitbit API diary with bedtime offsets",
        input: api_diary_with_bedtime_offsets,
        expected: {
            "records": api_diary_with_bedtime_offsets_records,
        }
    });

    test_parse({
        file_format: "Fitbit",
        name: "Fitsaver diary",
        input: fitsaver_diary,
        expected: {
            "records": simple_records,
        }
    });

    test_parse({
        file_format: "Fitbit",
        name: "fitbit-n24 diary",
        input: fitbit_n24_diary,
        expected: {
            "records": fitbit_n24_records,
        }
    });

    test_parse({
        file_format: "Fitbit",
        name: "Archive diary",
        input: {
            "user-site-export/sleep-2010-11-12.json": archive_json_diary,
        },
        expected: {
            "records": simple_records,
        }
    });

    test_parse({
        file_format: "Fitbit",
        name: "Hard-to-parse diary",
        input:
            'Sleep\n' +
            'Start Time,End Time,Minutes Asleep,Minutes Awake,Number of Awakenings,Time in Bed,Minutes REM Sleep,Minutes Light Sleep,Minutes Deep Sleep\n' +
            '"2010-11-12 1:23AM","12-11-2010 2:34PM","5,000","500","300","N/A","1,000","3,000","1,000"\n' +
            '"2010-11-12 1:23 AM","12-11-2010 2:34 PM","500","5,000","300","5,000","N/A","3,000","1,000"\n' +
            '"2010-11-12 1:23am","12-11-2010 2:34pm","5,000","500","300","5,000","1,000","N/A","1,000"\n' +
            '"2010-11-12 1:23 am","12-11-2010 2:34 pm","5,000","500","300","5,000","1,000","3,000","N/A"\n' +
'\n'

        ,
        //spreadsheetify: "disable", // uncomment if this format is not compatible with spreadsheets
        //output: 'disable', // uncomment if this format contains information that can't be output
        //debug: true, // uncomment to get console.log() messages about this test
        expected: {
            "records": [
                {
                    "End Time": simple_end_time,
                    "end"     : simple_end_time,
                    "Start Time": simple_end_time - 5500*60*1000,
                    "start"     : simple_end_time - 5500*60*1000,
                    "Minutes Asleep": 5000,
                    "Minutes Awake": 500,
                    "Number of Awakenings": 300,
                    "Time in Bed": null,
                    "Minutes REM Sleep": 1000,
                    "Minutes Light Sleep": 3000,
                    "Minutes Deep Sleep": 1000,
                },
                {
                    "End Time": simple_end_time,
                    "end"     : simple_end_time,
                    "Start Time": simple_end_time - 5500*60*1000,
                    "start"     : simple_end_time - 5500*60*1000,
                    "Minutes Asleep": 500,
                    "Minutes Awake": 5000,
                    "Number of Awakenings": 300,
                    "Time in Bed": 5000,
                    "Minutes REM Sleep": null,
                    "Minutes Light Sleep": 3000,
                    "Minutes Deep Sleep": 1000,
                },
                {
                    "End Time": simple_end_time,
                    "end"     : simple_end_time,
                    "Start Time": simple_end_time - 5500*60*1000,
                    "start"     : simple_end_time - 5500*60*1000,
                    "Minutes Asleep": 5000,
                    "Minutes Awake": 500,
                    "Number of Awakenings": 300,
                    "Time in Bed": 5000,
                    "Minutes REM Sleep": 1000,
                    "Minutes Light Sleep": null,
                    "Minutes Deep Sleep": 1000,
                },
                {
                    "End Time": simple_end_time,
                    "end"     : simple_end_time,
                    "Start Time": simple_end_time - 5500*60*1000,
                    "start"     : simple_end_time - 5500*60*1000,
                    "Minutes Asleep": 5000,
                    "Minutes Awake": 500,
                    "Number of Awakenings": 300,
                    "Time in Bed": 5000,
                    "Minutes REM Sleep": 1000,
                    "Minutes Light Sleep": 3000,
                    "Minutes Deep Sleep": null,
                },
            ],
        }
    });

    test_to({
        name: "Output test",
        format: "output",
        input   : simple_diary,
        expected: simple_diary,
    });

    test_to({
        name: "Standard Format test",
        format: "Standard",
        input: simple_diary,
        expected: [
            {
                "status"  : 'asleep',
                "start"   : simple_end_time - duration,
                "end"     : simple_end_time,
                "duration": duration,
                "start_of_new_day": true,
                "day_number"      : 2,
                "is_primary_sleep": true,
            }
        ],
    });

    test_merge({
        name: "Two empty diaries",
        left: empty_diary,
        right: empty_diary,
        expected: {
            "records": []
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

    test_merge({
        name: "Left non-empty, right empty",
        left: simple_diary,
        right: empty_diary,
        expected: {
            "records": simple_records,
        },
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
        name: "Two different diaries",
        left: simple_diary,
        right: "Sleep\n" +
        "Start Time,End Time,Minutes Asleep,Minutes Awake,Number of Awakenings,Time in Bed,Minutes REM Sleep,Minutes Light Sleep,Minutes Deep Sleep\n" +
        '"2012-11-10 3:21AM","2012-11-10 4:32PM","91","700","12,345","1,234","123","12","1"\n' +
        "\n",
        expected: {
            "records": [
                {
                    "Start Time": other_end_time - duration,
                    "End Time"  : other_end_time,
                    "start"     : other_end_time - duration,
                    "end"       : other_end_time,
                    "Minutes Asleep": 91,
                    "Minutes Awake" : 700,
                    "Number of Awakenings": 12345,
                    "Time in Bed"         : 1234,
                    "Minutes REM Sleep"   : 123,
                    "Minutes Light Sleep" : 12,
                    "Minutes Deep Sleep"  : 1,
                }
            ].concat(simple_records),
        },
    });

});
