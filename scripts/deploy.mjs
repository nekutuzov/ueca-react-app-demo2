// Publishes the production build to the gh-pages branch with the gh-pages package, which keeps its
// own clone under node_modules/.cache - so there is no second checkout of this repository to keep
// in step. It replaced a sibling folder that had to exist, sit on the right branch, and be
// committed and pushed by hand after every build.
//
// `npm run deploy` builds first, through predeploy. The SPA fallback (404.html) is written by the
// build rather than here - see spaFallback() in vite.config.ts.

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import ghpages from 'gh-pages'

const DIST = 'dist'

for (const file of ['index.html', '404.html']) {
  if (!existsSync(resolve(DIST, file))) {
    console.error(`${DIST}/${file} is missing - run "npm run build" first.`)
    process.exit(1)
  }
}

// The branch carries built files only, so this message is the one place a reader can learn which
// source commit produced them. %x20 is git's escape for a space: it keeps the format one argument.
const source = execSync('git log -1 --pretty=format:%h%x20%s').toString().trim()

console.log(`Publishing ${DIST} to gh-pages...`)
ghpages.publish(DIST, { message: `Publish ${source}` }, (error) => {
  if (error) {
    console.error(error.message ?? error)
    process.exit(1)
  }
  console.log(`Published: ${source}`)
})
