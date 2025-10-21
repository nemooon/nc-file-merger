import { render } from 'hono/jsx/dom';
import { App } from './App';
import './index.css';

const root = document.getElementById('root');
if (root) {
  render(<App />, root);
}
