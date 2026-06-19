# Zeitlog core

Sleep-diary **format engines** — the parsing and serialising library behind the [Zeitlog](https://zeitlog.github.io/) tracker. A fork of [sleepdiary/core](https://github.com/sleepdiary/core), extended with **Fitbit** and **Google Health** import for circadian monitoring.

## Format documentation

Third-party notes on the file formats — practical issues implementers hit that aren't in the official docs:

- [Activity Log](src/ActivityLog/)
- [Fitbit](src/Fitbit/)
- [Google Health](src/GoogleHealth/)
- [Plees Tracker](src/PleesTracker/)
- [Sleep as Android](src/SleepAsAndroid/)
- [Sleepmeter](src/Sleepmeter/)
- [Spreadsheet Graph](src/SpreadsheetGraph/)
- [Spreadsheet Table](src/SpreadsheetTable/)

## Project map

Zeitlog (the tracker) and Zeitdex (docs & resources) for circadian rhythm disorders span a few repos across two GitHub orgs and one account:

**Zeitlog — tracker** · [@zeitlog](https://github.com/zeitlog) · <https://zeitlog.github.io/>

| Repo | Role |
|---|---|
| [zeitlog.github.io](https://github.com/zeitlog/zeitlog.github.io) | The tracker web app |
| [core](https://github.com/zeitlog/core) | Sleep-diary format engines (parsing) |
| [report](https://github.com/zeitlog/report) | Sleep-doctor report bundle |
| [info](https://github.com/zeitlog/info) | Analysis & charts bundle |

**Zeitdex — docs & resources** · [@zeitdex](https://github.com/zeitdex) · <https://zeitdex.github.io/>

| Repo | Role |
|---|---|
| [zeitdex.github.io](https://github.com/zeitdex/zeitdex.github.io) | Docs & resources site (MkDocs) |
| [docs](https://github.com/zeitdex/docs) | Documentation source |
| [resources](https://github.com/zeitdex/resources) | Specialist & software directory data |

**Pre-production** · [@wellivea1](https://github.com/wellivea1)

| Repo | Role |
|---|---|
| [dashboard-vibecode](https://github.com/wellivea1/dashboard-vibecode) | Pre-prod tracker · <https://wellivea1.github.io/dashboard-vibecode/> |
| [core-vibecode](https://github.com/wellivea1/core-vibecode) | Pre-prod core |

Forked from the [Sleep Diary Project](https://github.com/sleepdiary).

## License

A fork of Sleep Diary core, © 2020–2021 Sleepdiary Developers. Free software (GPL-2.0-only) with ABSOLUTELY NO WARRANTY — see [LICENSE](LICENSE).
