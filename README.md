# Environment Setup

## Prerequisites
- Node 16
- Posgresql >13.6

## Clone repository
- `git clone git@github.com:guidance/Gifts-for-Good-Forward.git`
- `cd Gifts-for-Good-Forward`
- `nvm install 16.14`
- `npm i`

## Database
### Get latest database dump from Heroku:
- Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) and create an account/log in
- Make sure you have access to GFG apps
- `heroku pg:backups:capture --app=gfg-giftforward-staging`
- `heroku pg:backups:download --app=gfg-giftforward-staging`
  
(this should create a 'latest.dump' file)

### Install Postgres DB:
- `brew install postgresql`
- `pg_ctl init -D {your path to database directory}`
- `/usr/local/Cellar/postgresql/14.2/bin/pg_ctl -D {your path to database directory} -l logfile start`

### Create “postgres” user:
- `createuser --interactive --pwprompt`
- Enter name of role to add: `postgres`
- Enter password for new role: `postgres`
- Enter it again: `postgres`
- Shall the new role be a superuser? `n`
- Shall the new role be allowed to create databases? `n`
- Shall the new role be allowed to create more new roles? `n`

### Create “giftdb” database:
- `sudo -u postgres`
- `createdb giftdb -U {username}`
- `psql giftdb -U {username}`
- `# alter user postgres superuser;`
- `psql giftdb -U postgres`
- `pg_restore --no-privileges --no-owner -d giftdb latest.dump -c -U postgres`

## Startup the application
- Copy `.env.development.example` and remove example from name
- Use Heroku env variables (dev or staging) for missing values.
-- Development mode
- `cd ./frontend`
- `npm install`
- `cd ../`
- `npm run dev`

-- Production mode
- `pm2 start server.js`
- application should be app and running on http://127.0.0.1:3000/register
- to see logs run: `pm2 logs --lines 1000`

### VSC debug session
Start debug session: go to Run and Debug tab and click play icon.

Settings are stored in `.vscode/launch.json`

# App versions
- VERSION_CURRENT
  
- VERSION_ALPHA
  
    Version with changes concerning "Send gift" redesign

# "Send gift" flow

- New "Send gift" flow is available on `/campaign/create` if `PLATFORM_VERSION` env var is >= 2.
- If new "Send gift" flow is enabled in app settings (`/admin-settings`), it is a default flow. All links to "Send gift" are redirected to `/campaign/create`.

# Campaign Status

- sending

    Campaign email was created and sent to customer, but did not know if it is sent successfully to the customer.
    
- sent

    Campaign email was sent to the customer successfully.

- bounced

    Campaign email wasn't sent to the customer and bounced.

- confirmed

    Customer checked gift, inputted shipping information and submitted.

- redeemed

    Cron routine has created new order from the confirmed order.

- canceled

    Order creation failed.

- shipped

    Order is being tracked on the shopify.

- delivered

    Order was delivered successfully.

- reactivated

    Contact was force-reactivated by admin.

- expired 
    
    Contact was force-expired by admin.

# Start / Stop Web Service

It manages web service by using pm2 & node

- Starting Service

    pm2 start server.js
    
- Stopping Service

    pm2 stop all

- Restarting Service

    pm2 restart all
    
- Check status of Service
    
    pm2 status all
    
- Check server log
    
    pm2 logs
    
# Manage Database on the CUI in Ubuntu

Database name is giftdb

- Start database service
    
    service mongod start
    
- Stop database service

    service mongod stop
    
- Restart database service

    service mongod restart
    
- Check status of database service

    service mongod status
    
# Manage database on the GUI in Windows

- Install mongodb-win32-x86_64-2012plus-4.2.6-signed.msi

- Login mongodb from Robo3T using SSH
    
    In the SSH tab of Robo3T login dialog, input SSH address, username and password
    
    You can manage database on the GUI after logged in 

# Git command to push onto dev branch

- git push -u origin master:dev

- git clone --single-branch --branch dev <remote-repo># gfg

# Env variables
Copy '.env.local.example' and rename the file to '.env.development'
Use Heroku env variables (dev or staging) for missing values.
