import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@cloudscape-design/components';
import VisualizerPage from './pages/VisualizerPage';
import SettingsPage from './pages/SettingsPage';
import DocsPage from './pages/DocsPage';

function App() {

  return (
    <AppLayout
      navigationHide={true}
      disableContentPaddings={true}
      content={
        <Routes>
          <Route path="/" element={<VisualizerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/docs" element={<DocsPage />} />
        </Routes>
      }
      toolsHide
    />
  );
}

export default App;