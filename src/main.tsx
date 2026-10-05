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
      // The dev server has no search corpus, so it builds one; the built page fetches what tools/build-data.ts wrote.
      source={{ base: dev ? 'sample/' : 'data/', corpus: import.meta.env.DEV ? 'compute' : 'fetch' }}
      dev={dev}
      pinnedVersion={params.get('v')}
      initialSelection={decodeSelection(params.get('c'))}
    />
  ),
  mount,
);
