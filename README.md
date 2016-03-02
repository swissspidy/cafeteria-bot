# HSR Cafeteria Bot

## Configuration

1. Fork this repository
2. Set up an incoming webhook in Slack and save the webhook URL in an environment variable, like this:
    
    ```
    export CAFETERIA_SLACK_URL='https://hooks.slack.com/…'
    ```
  
3. Adjust `schoolDays` and perhaps `cafeterias` in `run.js`
4. To run, simple execute `node run.js` (after `npm install`, of course).

Pro tip: Set up a cron job! For example, this will post the lunch menu every day at 10 o’clock:

`* 10 * * * node /Users/Pascal/Workspace/GitHub/cafeteria-bot/run.js >/dev/null 2>&1`

## License

GPLv3