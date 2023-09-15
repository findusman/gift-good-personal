# Send Gift - React module

Introducing a webpack based build workflow for front-end concens.

Webpack configuration file, `./webpack.config.js`

## Entry files
* Common, `./frontend/common/index.js` - this can be used to support global/common concerns
* Campaign Create, `./frontend/campaign/create.js` - this can be used to support the redesigned Create Campaign UI/UX, which is being developed as a ReactJS application

## Output directory,
* `public/dist`

## Development workflow
* Run the Gift Forward application, `$ pm2-runtime start ecosystem.config.js`
* Run webpack in `frontend` directory, `$ npm run dev`
* Once ready to commit, run webpack, `$ npm run prod`

## State version
We use redux-persist to persist store in the user's local storage. Each time the store structure is considerably changed (meaning that using persisted outdated state will result in an app error), manually update the package version (patch number) in package.json. It will cause the app to reset its state.