// Publishes the production build to the gh-pages branch with the gh-pages package, which keeps its
// own clone in a cache directory - so there is no second checkout of this repository to keep in
// step. It replaced a sibling folder that had to exist, sit on the right branch, and be committed
// and pushed by hand after every build.
//
// `npm run deploy` builds first, through predeploy. The SPA fallback (404.html) is written by the
// build rather than here - see spaFallback() in vite.config.ts.

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

// Where that clone goes, decided before gh-pages is loaded: find-cache-dir reads CACHE_DIR at
// import time and appends the package's own name to it. The default sits in node_modules/.cache,
// beside the project - and a project on a drive that records no file ownership is one git will not
// touch until it has been told to trust it by path ("detected dubious ownership"). gh-pages
// reports that refusal as "Failed to get remote.origin.url", which points nowhere near the cause.
// The home directory is on a filesystem git is content with, so the clone is simply kept there.
process.env.CACHE_DIR ??= join(homedir(), '.cache', 'ueca-react-app-demo2')

const ghpages = (await import('gh-pages')).default

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

console.log(`Publishing ${DIST} to gh-pages (clone cached in ${process.env.CACHE_DIR})...`)
ghpages.publish(DIST, { message: `Publish ${source}` }, (error) => {
  if (error) {
    console.error(error.message ?? error)
    process.exit(1)
  }
  console.log(`Published: ${source}`)
})
