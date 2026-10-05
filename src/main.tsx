import { render } from '@solidjs/web';
import { App } from './app/App.tsx';
import { decodeSelection } from './lib/selection.ts';
import './styles.css';

const mount = document.getElementById('app');
if (mount === null) throw new Error('index.html has no #app element to render into.');

const params = new URLSearchParams(location.search);
const dev = params.get('dev') === 'sample';
render(
  () => (
    <App
      // The dev server and the sample tree have no search corpus, so the page builds one; the built page on the
      // published data fetches what tools/build-data.ts wrote.
      source={{ base: dev ? 'sample/' : 'data/', corpus: dev || import.meta.env.DEV ? 'compute' : 'fetch' }}
      dev={dev}
      pinnedVersion={params.get('v')}
      initialSelection={decodeSelection(params.get('c'))}
    />
  ),
  mount,
);
