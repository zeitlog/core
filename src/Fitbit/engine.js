/*
 * Copyright 2020-2022 Sleepdiary Developers <sleepdiary@pileofstuff.org>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";

/**
 * @public
 * @unrestricted
 * @augments DiaryBase
 *
 * @example
 * let diary = new_sleep_diary(contents_of_my_file));
 *
 * console.log(diary.records);
 * -> [
 *      {
 *        "start"               : 12345678,
 *        "end"                 : 23456789,
 *        "Start Time"          : "2010-10-10 8:09PM",
 *        "End Time"            : "2010-10-11 7:08AM",
 *        "Minutes Asleep"      : "500",
 *        "Minutes Awake"       : "50",
 *        "Number of Awakenings": "30",
 *        "Time in Bed"         : "500",
 *        "Minutes REM Sleep"   : "100",
 *        "Minutes Light Sleep" : "300",
 *        "Minutes Deep Sleep"  : "100",
 *      },
 *      ...
 *    ]
 *
 */
class DiaryFitbit extends DiaryBase {

    /**
     * @param {Object} file - file contents
     * @param {Function=} serialiser - function to serialise output
     */
    constructor(file,serialiser) {

        super(file,serialiser); // call the DiaryBase constructor

        /*
         * PROPERTIES
         */

        let records = [];

        /**
         * Spreadsheet manager
         * @protected
         * @type {Spreadsheet}
         */
        this["spreadsheet"] = new Spreadsheet(
            this,
            [
                // Define one object per sheet in the spreadsheet:
                {
                    "sheet" : "Records",
                    "member" : "records",
                    "cells": [
                        {
                            "member": "Start Time",
                            "type": "time",
                        },
                        {
                            "member": "End Time",
                            "type": "time",
                        },
                        {
                            "member": "Minutes Asleep",
                            "type": "number",
                        },
                        {
                            "member": "Minutes Awake",
                            "type": "number",
                        },
                        {
                            "member": "Number of Awakenings",
                            "type": "number",
                            "optional": true,
                        },
                        {
                            "member": "Time in Bed",
                            "type": "number",
                            "optional": true,
                        },
                        {
                            "member": "Minutes REM Sleep",
                            "type": "number",
                            "optional": true,
                        },
                        {
                            "member": "Minutes Light Sleep",
                            "type": "number",
                            "optional": true,
                        },
                        {
                            "member": "Minutes Deep Sleep",
                            "type": "number",
                            "optional": true,
                        },
                        {
                            "members": [],
                            "export": (array_element,row,offset) => true,
                            "import": (array_element,row,offset) => {
                                array_element["end"] = array_element["End Time"];
                                array_element["start"] = array_element["Start Time"];
                                return true;
                            },
                        },
                    ],
                },
            ]
        );

        /*
         * We use a regex-based parser here instead of the general CSV parser.
         * The file begins with a magic number "Sleep\n", which is not currently
         * handled by the general parser.  The rest of the format is simple
         * enough not to bother adding complexity elsewhere.
         */

        const fitbit_header
              = "Sleep\n"
              + "Start Time,End Time,Minutes Asleep,Minutes Awake,Number of Awakenings,Time in Bed,Minutes REM Sleep,Minutes Light Sleep,Minutes Deep Sleep\n"
        ;

        const fitbit_footer = "\n";

        const fitbit_timestamp = '"(([0-9][0-9]*)-([0-9][0-9]*)-([0-9][0-9]*) ([0-9][0-9]*):([0-9][0-9]*) *([AP])M)"';

        const fitbit_number       = '"([0-9][0-9,]*)"';
        const fitbit_maybe_number = '"([0-9][0-9,]*|N/A)"';

        const fitbit_line
              = fitbit_timestamp
              + ',' + fitbit_timestamp
              + ',' + fitbit_number // Minutes Asleep
              + ',' + fitbit_number // Minutes Awake
              + ',' + fitbit_maybe_number // Number of Awakenings
              + ',' + fitbit_maybe_number // Time in Bed
              + ',' + fitbit_maybe_number // Minutes REM Sleep
              + ',' + fitbit_maybe_number // Minutes Light Sleep
              + ',' + fitbit_maybe_number // Minutes Deep Sleep
              + "\n"
        ;

        const fitbit_file_re = new RegExp(
              '^'   + fitbit_header
            + '(?:' + fitbit_line   + ')*'
            +         fitbit_footer + '$',
            'i'
        );

        function parse_timestamp( year, month, day, hour, minute, ap ) {
            year = parseInt(year,10);
            month = parseInt(month,10);
            day = parseInt(day,10);
            hour = parseInt(hour,10);
            if ( hour == 12 ) {
                if ( ap == 'A' ) hour = 0;
            } else if ( ap == 'P' ) {
                hour += 12;
            }
            minute = parseInt(minute,10);
            if ( day > 31 ) { // DD-MM-YYYY instead of YYYY-MM-DD
                return new Date(day, month-1, year, hour, minute).getTime();
            } else {
                return new Date(year, month-1, day, hour, minute).getTime();
            }
        }

        function parse_number(str) {
            return parseInt(str.replace(/,/g,''),10);
        }

        function parse_maybe_number(str) {
            return ( str == "N/A" ) ? null : parse_number(str);
        }

        function parse_csv_records(contents) {
            if ( !fitbit_file_re.test(contents) ) return null;
            let records = [];
            contents.replace(
                new RegExp(fitbit_line,'gi'),
                (_,
                 start_time, start_year,start_month,start_day,start_hour,start_minute,start_ap,
                 end_time, end_year,end_month,end_day,end_hour,end_minute,end_ap,
                 minutes_asleep,minutes_awake,number_of_awakenings,time_in_bed,minutes_rem_sleep,minutes_light_sleep,minutes_deep_sleep
                ) => {
                    let end = parse_timestamp( end_year, end_month, end_day, end_hour, end_minute, end_ap.toUpperCase() ),
                        record = {
                            "End Time"            : end,
                            "Minutes Asleep"      : parse_number(minutes_asleep),
                            "Minutes Awake"       : parse_number(minutes_awake),
                            "Number of Awakenings": parse_maybe_number(number_of_awakenings),
                            "Time in Bed"         : parse_maybe_number(time_in_bed),
                            "Minutes REM Sleep"   : parse_maybe_number(minutes_rem_sleep),
                            "Minutes Light Sleep" : parse_maybe_number(minutes_light_sleep),
                            "Minutes Deep Sleep"  : parse_maybe_number(minutes_deep_sleep),
                            "end"                 : end,
                        };
                    record["Start Time"] = record["start"] = end - ( record["Minutes Asleep"] + record["Minutes Awake"] ) * 60*1000;
                    records.push(record);
                }
            );
            return records;
        }

        function get_first_value(record,keys) {
            for ( let n=0; n!=keys.length; ++n ) {
                if ( Object.prototype.hasOwnProperty.call(record,keys[n]) ) {
                    return record[keys[n]];
                }
            }
        }

        function parse_json_timestamp(value) {
            let ret = DiaryBase.parse_timestamp(value);
            return isNaN(ret) ? NaN : ret;
        }

        function parse_json_number(value) {
            if ( value === null || value === undefined || value === '' || value === "N/A" ) return null;
            if ( typeof(value) == "number" ) return value;
            if ( value.replace ) {
                value = value.replace(/,/g,'').trim();
                if ( !value.length || value == "N/A" ) return null;
                value = parseInt(value,10);
                return isNaN(value) ? NaN : value;
            }
            return NaN;
        }

        function get_level_summary_minutes(entry,key) {
            const levels = get_first_value(entry,["levels"]),
                  stages = get_first_value(entry,["stages"])
            ;
            if ( levels && levels.summary && levels.summary[key] ) {
                return levels.summary[key].minutes;
            }
            if ( stages && Object.prototype.hasOwnProperty.call(stages,key) ) {
                return stages[key];
            }
            switch ( key ) {
            case "deep":
                return get_first_value(entry,["SleepLevelDeep"]);
            case "light":
                return get_first_value(entry,["SleepLevelLight"]);
            case "rem":
                return get_first_value(entry,["SleepLevelRem"]);
            case "wake":
                return get_first_value(entry,["SleepLevelWake","SleepLevelAwake"]);
            case "awake":
                return get_first_value(entry,["SleepLevelAwake","SleepLevelWake"]);
            }
        }

        function looks_like_json_fitbit_record(entry) {
            if ( !entry || typeof(entry) != "object" ) return false;
            return (
                get_first_value(entry,["startTime","StartDate","endTime","EndDate","dateOfSleep"]) !== undefined
                && get_first_value(entry,["minutesAsleep","MinutesAsleep","duration","Duration","durationMs","levels","stages"]) !== undefined
            );
        }

        function extract_json_fitbit_records(node) {
            let ret = [];
            if ( !node ) return ret;

            if ( Array.isArray(node) ) {
                node.forEach( entry => ret = ret.concat(extract_json_fitbit_records(entry)) );
                return ret;
            }

            if ( typeof(node) != "object" ) return ret;

            if ( looks_like_json_fitbit_record(node) ) {
                return [node];
            }

            if ( Array.isArray(node["sleep"]) ) {
                return extract_json_fitbit_records(node["sleep"]);
            }

            if ( node["sleep"] ) {
                ret = ret.concat(extract_json_fitbit_records(node["sleep"]));
            }

            if ( node["results"] ) {
                ret = ret.concat(extract_json_fitbit_records(node["results"]));
            }

            Object.keys(node).forEach( key => {
                if ( key != "sleep" && key != "results" && key.search(/sleep/i) != -1 ) {
                    ret = ret.concat(extract_json_fitbit_records(node[key]));
                }
            });

            return ret;
        }

        function parse_json_record(entry) {
            let minutes_asleep = parse_json_number( get_first_value(entry,["minutesAsleep","MinutesAsleep"]) ),
                minutes_awake = parse_json_number( get_first_value(entry,["minutesAwake","MinutesAwake"]) ),
                number_of_awakenings = parse_json_number( get_first_value(entry,["awakeningsCount","awakeCount","AwakeCount","Number of Awakenings"]) ),
                time_in_bed = parse_json_number( get_first_value(entry,["timeInBed","TimeInBed"]) ),
                minutes_to_fall_asleep = parse_json_number( get_first_value(entry,["minutesToFallAsleep","MinutesToFallAsleep"]) ) || 0,
                minutes_after_wakeup = parse_json_number( get_first_value(entry,["minutesAfterWakeup","MinutesAfterWakeup"]) ) || 0,
                start = parse_json_timestamp( get_first_value(entry,["startTime","StartDate"]) ),
                end = parse_json_timestamp( get_first_value(entry,["endTime","EndDate"]) ),
                duration = parse_json_number( get_first_value(entry,["duration","Duration","durationMs"]) ),
                minutes_rem_sleep = parse_json_number( get_level_summary_minutes(entry,"rem"  ) ),
                minutes_light_sleep = parse_json_number( get_level_summary_minutes(entry,"light") ),
                minutes_deep_sleep = parse_json_number( get_level_summary_minutes(entry,"deep" ) )
            ;

            if ( minutes_awake === null ) {
                minutes_awake = parse_json_number( get_level_summary_minutes(entry,"wake") );
            }
            if ( minutes_awake === null ) {
                minutes_awake = parse_json_number( get_level_summary_minutes(entry,"awake") );
            }
            if ( minutes_awake === null && time_in_bed !== null && !isNaN(time_in_bed) && minutes_asleep !== null && !isNaN(minutes_asleep) ) {
                minutes_awake = time_in_bed - minutes_asleep - minutes_to_fall_asleep - minutes_after_wakeup;
            }
            if ( time_in_bed === null && duration !== null && !isNaN(duration) ) {
                time_in_bed = Math.round(duration / (60*1000));
            }
            if ( isNaN(end) && !isNaN(start) && duration !== null && !isNaN(duration) ) {
                end = start + duration;
            }
            if ( minutes_asleep === null || minutes_awake === null ) return null;
            if ( isNaN(minutes_asleep) || isNaN(minutes_awake) ) return null;
            if ( isNaN(start) && isNaN(end) ) return null;

            if ( isNaN(end) ) {
                end = start + ( minutes_asleep + minutes_awake ) * 60*1000;
            }
            // Match the legacy CSV importer: Fitbit exports expose a raw start
            // time, but the dashboard historically plots sessions from the
            // end time minus asleep+awake minutes.
            start = end - ( minutes_asleep + minutes_awake ) * 60*1000;

            return {
                "Start Time"          : start,
                "End Time"            : end,
                "Minutes Asleep"      : minutes_asleep,
                "Minutes Awake"       : minutes_awake,
                "Number of Awakenings": number_of_awakenings,
                "Time in Bed"         : time_in_bed,
                "Minutes REM Sleep"   : minutes_rem_sleep,
                "Minutes Light Sleep" : minutes_light_sleep,
                "Minutes Deep Sleep"  : minutes_deep_sleep,
                "start"               : start,
                "end"                 : end,
            };
        }

        function normalise_records(records) {
            const seen = {};
            return records
                .filter( record => record )
                .sort( (a,b) => b["start"] - a["start"] )
                .filter( record => {
                    const id = record["start"] + '\uE000' + record["end"];
                    if ( seen[id] ) return false;
                    seen[id] = 1;
                    return true;
                })
            ;
        }

        function parse_json_records(contents) {
            let parsed;
            try {
                parsed = JSON.parse(contents);
            } catch (e) {
                return null;
            }
            let records = normalise_records(extract_json_fitbit_records(parsed).map(parse_json_record));
            return records.length ? records : null;
        }

        function parse_archive_records(contents) {
            let records = [];
            Object.keys(contents).forEach( filename => {
                const file_contents = contents[filename];
                if ( typeof(file_contents) != "string" ) return;
                if ( filename.search(/\.csv$/i) != -1 ) {
                    const csv_records = parse_csv_records(file_contents);
                    if ( csv_records ) records = records.concat(csv_records);
                }
                if ( filename.search(/\.json$/i) != -1 ) {
                    const json_records = parse_json_records(file_contents);
                    if ( json_records ) records = records.concat(json_records);
                }
            });
            records = normalise_records(records);
            return records.length ? records : null;
        }

        switch ( file["file_format"]() ) {

        case "string":

            const contents = file["contents"];
            let parsed_records = parse_csv_records(contents) || parse_json_records(contents);
            if ( !parsed_records ) {

                return this.invalid(file);

            } else {

                this["records"] = parsed_records;

            }
            break;

        case "archive":

            records = parse_archive_records(file["contents"]);
            if ( !records ) return this.invalid(file);
            this["records"] = records;
            break;

        default:

            if ( this.initialise_from_common_formats(file) ) {
                this["records"].forEach(
                    record => [
                        "Number of Awakenings",
                        "Time in Bed",
                        "Minutes REM Sleep",
                        "Minutes Light Sleep",
                        "Minutes Deep Sleep"
                    ].forEach( key => Object.prototype.hasOwnProperty.call(record,key) || ( record[key] = null ) )
                );
                return;
            }

            /**
             * Individual records from the sleep diary
             * @type {Array}
             */
            this["records"] = (
                file["to"]("Standard")["records"]
                    .filter( r => r["status"] == "asleep" )
                    .map( (r,n) => ({
                        "start"               : r["start"],
                        "end"                 : r["end"  ],
                        "Start Time"          : r["start"],
                        "End Time"            : r["end"],
                        "Minutes Asleep"      : Math.round( ( r["end"] - r["start"] ) / (60*1000) ),
                        "Minutes Awake"       : 0,
                        "Number of Awakenings": null,
                        "Time in Bed"         : null,
                        "Minutes REM Sleep"   : null,
                        "Minutes Light Sleep" : null,
                        "Minutes Deep Sleep"  : null,
                    }))
            );

            break;

        }

    }

    ["to"](to_format) {

        switch ( to_format ) {

        case "output":

            return this.serialise({
                "file_format": () => "string",
                "contents": [
                    "Sleep",
                    "Start Time,End Time,Minutes Asleep,Minutes Awake,Number of Awakenings,Time in Bed,Minutes REM Sleep,Minutes Light Sleep,Minutes Deep Sleep",
                ].concat(
                    this["records"].map(
                        r => [
                            "Start Time",
                            "End Time",
                        ].map(
                            date => {
                                date = new Date(r[date]);
                                const hours = date["getHours"]();
                                return (
                                    '"' +
                                    date["getFullYear"]() +
                                    '-' +
                                    DiaryBase.zero_pad( date["getMonth"]()+1 ) +
                                    '-' +
                                    DiaryBase.zero_pad( date["getDate" ] () ) +
                                    ' ' +
                                    ( ( hours % 12 ) || 12 ) +
                                    ':' +
                                    DiaryBase.zero_pad( date["getMinutes"]() ) +
                                    ( ( hours >= 12 ) ? 'PM' : 'AM' ) +
                                    '"'
                                );
                            }
                        ).concat([
                            "Minutes Asleep",
                            "Minutes Awake",
                            "Number of Awakenings",
                            "Time in Bed",
                            "Minutes REM Sleep",
                            "Minutes Light Sleep",
                            "Minutes Deep Sleep"
                        ].map(
                            key => (
                                ( r[key] === null )
                                ? '"N/A"'
                                // based on https://stackoverflow.com/a/2901298
                                : '"' + r[key].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '"'
                            )
                        )).join(',')
                    ),
                    "\n" // Fitbit format includes a trailing newline
                ).join("\n")
            });

        case "Standard":

            return new DiaryStandard({
                "records": this["records"].map(
                    r => ({
                        "status"  : "asleep",
                        "start"   : r["start"],
                        "end"     : r["end"  ],
                        "duration": r["end"] - r["start"],
                    })
                ),
            }, this.serialiser);

        default:

            return super["to"](to_format);

        }

    }

    ["merge"](other) {

        other = other["to"](this["file_format"]());

        this["records"] = this["records"].concat(
            DiaryBase.unique(
                this["records"],
                other["records"],
                ["start","end"]
            )
        )
        // Fitbit records are always in reverse chronological order:
            .sort( (a,b) => b["start"] - a["start"] )
        ;

        return this;

    }

    ["file_format"]() { return "Fitbit"; }
    ["format_info"]() {
        return {
            "name": "Fitbit",
            "title": "fitbit",
            "url": "/src/Fitbit",
            "statuses": [ "asleep" ],
            "extension": ".csv,.json,.zip",
            "logo": "https://community.fitbit.com/html/assets/fitbit_logo_1200.png",
            "timezone": "tzdata",
        }
    }

}

DiaryBase.register(DiaryFitbit);
