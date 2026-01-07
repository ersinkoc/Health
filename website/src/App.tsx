import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Home } from '@/pages/Home';
import { Docs } from '@/pages/Docs';
import { Introduction } from '@/pages/docs/Introduction';
import { API } from '@/pages/API';
import { Examples } from '@/pages/Examples';
import { Plugins } from '@/pages/Plugins';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/docs" element={<Docs />}>
            <Route index element={<Introduction />} />
            <Route path="installation" element={<Introduction />} />
            <Route path="quick-start" element={<Introduction />} />
            <Route path="health-checks" element={<Introduction />} />
            <Route path="probes" element={<Introduction />} />
            <Route path="scoring" element={<Introduction />} />
            <Route path="plugins" element={<Introduction />} />
            <Route path="cli" element={<Introduction />} />
            <Route path="configuration" element={<Introduction />} />
          </Route>
          <Route path="/api" element={<API />} />
          <Route path="/examples" element={<Examples />} />
          <Route path="/plugins" element={<Plugins />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
