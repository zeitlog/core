/*
 * Copyright 2020-2026 Sleepdiary Developers <sleepdiary@pileofstuff.org>
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
 * let diary = new_sleep_diary(contents_of_my_google_health_response);
 *
 * console.log(diary.records);
 * -> [
 *      {
 *        "start"         : 1772581050000,
 *        "end"           : 1772608890000,
 *        "Start Time"    : 1772581050000,
 *        "End Time"      : 1772608890000,
 *        "Minutes Asleep": 407,
 *        "Minutes Awake" : 57,
 *      },
 *      ...
 *    ]
 *
 */
class DiaryGoogleHealth extends DiaryBase {

    /**
     * @param {Object} file - file contents
     * @param {Function=} serialiser - function to serialise output
     */
    constructor(file,serialiser) {

        super(file,serialiser);

        let records = [];

        /**
         * Spreadsheet manager
         * @protected
         * @type {Spreadsheet}
         */
        this["spreadsheet"] = new Spreadsheet(
            this,
            [
                {
                    "sheet" : "Records",
                    "member" : "records",
                    "cells": [
                        {
                            "member": "Id",
                            "type": "string",
                            "optional": true,
                        },
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
                            "optional": true,
                        },
                        {
                            "member": "Minutes Awake",
                            "type": "number",
                            "optional": true,
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
                            "member": "Type",
                            "type": "string",
                            "optional": true,
                        },
                        {
                            "member": "Is Main Sleep",
                            "type": "boolean",
                            "optional": true,
                        },
                        {
                            "member": "Is Nap",
                            "type": "boolean",
                            "optional": true,
                        },
                        {
                            "members": [],
                            "export": (array_element,row,offset) => true,
                            "import": (array_element,row,offset) => {
                                array_element["start"] = array_element["Start Time"];
                                array_element["end"] = array_element["End Time"];
                                return true;
                            },
                        },
                    ],
                },
            ]
        );

        function get_first_value(record,keys) {
            for ( let n=0; n!=keys.length; ++n ) {
                if ( Object.prototype.hasOwnProperty.call(record,keys[n]) ) {
                    return record[keys[n]];
                }
            }
        }

        function parse_timestamp(value) {
            let ret = DiaryBase.parse_timestamp(value);
            return isNaN(ret) ? NaN : ret;
        }

        function parse_number(value) {
            if ( value === null || value === undefined || value === '' ) return null;
            if ( typeof(value) == "number" ) return value;
            if ( value.replace ) {
                value = value.replace(/,/g,'').trim();
                if ( !value.length ) return null;
                value = parseInt(value,10);
                return isNaN(value) ? NaN : value;
            }
            return NaN;
        }

        function minutes_between(start,end) {
            return Math.round((end-start)/(60*1000));
        }

        function stage_type(stage) {
            return ( stage["type"] || "" ).toUpperCase();
        }

        function get_stage_summary(sleep,type,key) {
            const summary = sleep["summary"],
                  stages_summary = summary && summary["stagesSummary"]
            ;
            if ( !Array.isArray(stages_summary) ) return null;
            for ( let n=0; n!=stages_summary.length; ++n ) {
                if ( stage_type(stages_summary[n]) == type ) {
                    return parse_number(stages_summary[n][key]);
                }
            }
            return null;
        }

        function sum_stage_minutes(sleep,types) {
            const stages = sleep["stages"];
            if ( !Array.isArray(stages) ) return null;
            let ret = 0,
                found = false
            ;
            stages.forEach( stage => {
                if ( types.indexOf(stage_type(stage)) == -1 ) return;
                const start = parse_timestamp(stage["startTime"]),
                      end = parse_timestamp(stage["endTime"])
                ;
                if ( isNaN(start) || isNaN(end) || end <= start ) return;
                ret += minutes_between(start,end);
                found = true;
            });
            return found ? ret : null;
        }

        function count_stage_segments(sleep,types) {
            const stages = sleep["stages"];
            if ( !Array.isArray(stages) ) return null;
            let ret = 0;
            stages.forEach( stage => {
                if ( types.indexOf(stage_type(stage)) != -1 ) ++ret;
            });
            return ret || null;
        }

        function looks_like_google_health_sleep_point(point) {
            const sleep = point && point["sleep"],
                  interval = sleep && sleep["interval"]
            ;
            return !!(
                interval
                && interval["startTime"]
                && interval["endTime"]
            );
        }

        function extract_google_health_sleep_points(node) {
            let ret = [];
            if ( !node ) return ret;

            if ( Array.isArray(node) ) {
                node.forEach( entry => ret = ret.concat(extract_google_health_sleep_points(entry)) );
                return ret;
            }

            if ( typeof(node) != "object" ) return ret;

            if ( looks_like_google_health_sleep_point(node) ) {
                return [node];
            }

            if ( Array.isArray(node["dataPoints"]) ) {
                return extract_google_health_sleep_points(node["dataPoints"]);
            }

            if ( node["dataPoint"] ) {
                ret = ret.concat(extract_google_health_sleep_points(node["dataPoint"]));
            }

            if ( node["response"] ) {
                ret = ret.concat(extract_google_health_sleep_points(node["response"]));
            }

            return ret;
        }

        function parse_record(point) {
            const sleep = point["sleep"],
                  interval = sleep["interval"],
                  summary = sleep["summary"] || {},
                  metadata = sleep["metadata"] || {},
                  start = parse_timestamp(interval["startTime"]),
                  end = parse_timestamp(interval["endTime"])
            ;

            if ( isNaN(start) || isNaN(end) || end <= start ) return null;

            let time_in_bed = parse_number(summary["minutesInSleepPeriod"]),
                minutes_asleep = parse_number(summary["minutesAsleep"]),
                minutes_awake = parse_number(summary["minutesAwake"]),
                minutes_rem_sleep = get_stage_summary(sleep,"REM","minutes"),
                minutes_light_sleep = get_stage_summary(sleep,"LIGHT","minutes"),
                minutes_deep_sleep = get_stage_summary(sleep,"DEEP","minutes"),
                number_of_awakenings = get_stage_summary(sleep,"AWAKE","count")
            ;

            if ( time_in_bed === null || isNaN(time_in_bed) ) {
                time_in_bed = minutes_between(start,end);
            }
            if ( minutes_rem_sleep === null ) {
                minutes_rem_sleep = sum_stage_minutes(sleep,["REM"]);
            }
            if ( minutes_light_sleep === null ) {
                minutes_light_sleep = sum_stage_minutes(sleep,["LIGHT"]);
            }
            if ( minutes_deep_sleep === null ) {
                minutes_deep_sleep = sum_stage_minutes(sleep,["DEEP"]);
            }
            if ( minutes_awake === null || isNaN(minutes_awake) ) {
                minutes_awake = sum_stage_minutes(sleep,["AWAKE","RESTLESS"]);
            }
            if ( minutes_asleep === null || isNaN(minutes_asleep) ) {
                const sleep_stage_minutes = sum_stage_minutes(sleep,["ASLEEP","LIGHT","DEEP","REM"]);
                if ( sleep_stage_minutes !== null ) {
                    minutes_asleep = sleep_stage_minutes;
                } else if ( minutes_awake !== null && !isNaN(minutes_awake) ) {
                    minutes_asleep = time_in_bed - minutes_awake;
                }
            }
            if ( number_of_awakenings === null ) {
                number_of_awakenings = count_stage_segments(sleep,["AWAKE"]);
            }

            const id = point["name"] || metadata["externalId"] || [
                interval["startTime"],
                interval["endTime"],
                (point["dataSource"]||{})["platform"] || "",
            ].join("\uE000");

            return {
                "Id"                  : id,
                "Start Time"          : start,
                "End Time"            : end,
                "Minutes Asleep"      : minutes_asleep,
                "Minutes Awake"       : minutes_awake,
                "Number of Awakenings": number_of_awakenings,
                "Time in Bed"         : time_in_bed,
                "Minutes REM Sleep"   : minutes_rem_sleep,
                "Minutes Light Sleep" : minutes_light_sleep,
                "Minutes Deep Sleep"  : minutes_deep_sleep,
                "Type"                : sleep["type"] || null,
                "Is Main Sleep"       : get_first_value(metadata,["main","isMainSleep"]) === true,
                "Is Nap"              : metadata["nap"] === true,
                "start"               : start,
                "end"                 : end,
            };
        }

        function normalise_records(records) {
            const seen = {};
            return records
                .filter( record => record )
                .sort( (a,b) => b["start"] - a["start"] || b["end"] - a["end"] )
                .filter( record => {
                    const id = record["Id"] || record["start"] + '\uE000' + record["end"];
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
            const is_google_health_response = (
                parsed
                && typeof(parsed) == "object"
                && Array.isArray(parsed["dataPoints"])
            );
            const parsed_records = normalise_records(
                extract_google_health_sleep_points(parsed).map(parse_record)
            );
            if ( is_google_health_response && !parsed["dataPoints"].length ) return [];
            return parsed_records.length ? parsed_records : null;
        }

        function parse_archive_records(contents) {
            let parsed_records = [];
            Object.keys(contents).forEach( filename => {
                const file_contents = contents[filename];
                if ( typeof(file_contents) != "string" ) return;
                if ( filename.search(/\.json$/i) == -1 ) return;
                const json_records = parse_json_records(file_contents);
                if ( json_records ) parsed_records = parsed_records.concat(json_records);
            });
            parsed_records = normalise_records(parsed_records);
            return parsed_records.length ? parsed_records : null;
        }

        function standard_record_to_google_health(record,n) {
            const start = record["start"],
                  end = record["end"],
                  duration = end - start
            ;
            return {
                "Id": "standard-" + n + "-" + start + "-" + end,
                "Start Time": start,
                "End Time": end,
                "Minutes Asleep": Math.round(duration/(60*1000)),
                "Minutes Awake": 0,
                "Number of Awakenings": null,
                "Time in Bed": Math.round(duration/(60*1000)),
                "Minutes REM Sleep": null,
                "Minutes Light Sleep": null,
                "Minutes Deep Sleep": null,
                "Type": "SLEEP_TYPE_UNSPECIFIED",
                "Is Main Sleep": !!record["is_primary_sleep"],
                "Is Nap": false,
                "start": start,
                "end": end,
            };
        }

        switch ( file["file_format"]() ) {

        case "string":

            records = parse_json_records(file["contents"]);
            if ( !records ) return this.invalid(file);
            this["records"] = records;
            break;

        case "archive":

            records = parse_archive_records(file["contents"]);
            if ( !records ) return this.invalid(file);
            this["records"] = records;
            break;

        default:

            if ( this.initialise_from_common_formats(file) ) return;

            this["records"] = normalise_records(
                file["to"]("Standard")["records"]
                    .filter( r => (
                        r["status"] == "asleep"
                        && r["start"] !== undefined
                        && r["end"] !== undefined
                        && r["end"] > r["start"]
                    ))
                    .map(standard_record_to_google_health)
            );

            break;

        }

    }

    ["to"](to_format) {

        function record_to_data_point(record) {
            const start = new Date(record["start"]).toISOString(),
                  end = new Date(record["end"]).toISOString(),
                  maybe_string = value => ( value === null || value === undefined ) ? undefined : String(value),
                  stages_summary = [
                      [ "AWAKE", "Minutes Awake"       , "Number of Awakenings" ],
                      [ "REM"  , "Minutes REM Sleep"   , null                   ],
                      [ "LIGHT", "Minutes Light Sleep" , null                   ],
                      [ "DEEP" , "Minutes Deep Sleep"  , null                   ],
                  ].filter( pair => record[pair[1]] !== null && record[pair[1]] !== undefined ).map(
                      pair => {
                          const ret = {
                              "type": pair[0],
                              "minutes": String(record[pair[1]]),
                          };
                          if ( pair[2] && record[pair[2]] !== null && record[pair[2]] !== undefined ) {
                              ret["count"] = String(record[pair[2]]);
                          }
                          return ret;
                      }
                  )
            ;
            return {
                "name": record["Id"],
                "sleep": {
                    "interval": {
                        "startTime": start,
                        "startUtcOffset": "0s",
                        "endTime": end,
                        "endUtcOffset": "0s",
                    },
                    "type": record["Type"] || "SLEEP_TYPE_UNSPECIFIED",
                    "metadata": {
                        "main": record["Is Main Sleep"] === true,
                        "nap": record["Is Nap"] === true,
                    },
                    "summary": {
                        "minutesInSleepPeriod": maybe_string(record["Time in Bed"]),
                        "minutesAsleep": maybe_string(record["Minutes Asleep"]),
                        "minutesAwake": maybe_string(record["Minutes Awake"]),
                        "stagesSummary": stages_summary,
                    },
                },
            };
        }

        switch ( to_format ) {

        case "output":

            return this.serialise({
                "file_format": () => "string",
                "contents": JSON.stringify({
                    "dataPoints": this["records"].map(record_to_data_point),
                },null,2),
            });

        case "Standard":

            return new DiaryStandard({
                "records": this["records"].map(
                    r => ({
                        "status"  : "asleep",
                        "start"   : r["start"],
                        "end"     : r["end"],
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
                record => record["Id"] || record["start"] + "\uE000" + record["end"]
            )
        )
            .sort( (a,b) => b["start"] - a["start"] || b["end"] - a["end"] )
        ;

        return this;

    }

    ["file_format"]() { return "GoogleHealth"; }
    ["format_info"]() {
        return {
            "name": "GoogleHealth",
            "title": "Google Health",
            "url": "/src/GoogleHealth",
            "statuses": [ "asleep" ],
            "extension": ".json",
            "logo": "https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png",
            "timezone": "UTC",
        }
    }

}

DiaryBase.register(DiaryGoogleHealth);
