# bitburner

Some scripts I used. I stole some of them, but wrote and adapted most of them.

## Scripts

The main scripts

* bootstrap.js - Initializes ports for flow control and service-to-service communication. Launches monitoring scripts. Launches dashboard script.
* core/dashboard.js - Launches attack and stock market automation scripts. Coordinates services to automate each part of the game.

Most services are named to coorespond to the aspect of the game is seeks to automate. For example the `services/corp.js` contains the CorpService which is responsible for automating corporations. Some services like the `EnvService` are utlity services that are used by other services and scripts.

The bootstrap script is really where things kick off in the majority of cases. Running `bootstrap.js --help` provides a help menu that should shed light on the available options when starting up the automations.

## Monitoring

### Log Tail

Most services send log events when they take some kind of action. These events are formatted and then sent to a port that essentially functions as an stream that is then displayed in the Log tail window.

### ShowEnv Tail

Similarly, other ports are setup to act essentially as environment variables that allow services to alter their behavior based on whatever state those values are in. For example, when the DO_STONKS port is set to 0, no stock buying automation will take place, only sales. These values are displayed by the ShowEnv tail window.

Many of these services

## Development

Only really relevant here if you're using the VS Code extension and API server.

### Types for your Scripts

https://gameplay.tips/guides/bitburner-autocomplete-your-scripts-in-vs-code.html#Autocomplete_Your_Scripts_in_VS_Code

For function params
`/** @param {import(".").NS } ns */`

For global variables
`/** @type import(".").NS */`
