import { Route, Routes } from 'react-router-dom';

function App() {
  return (
    <>
      <header>
        <h1>Wandy Wha Rang</h1>
      </header>
      <main>
        <Routes>
          <Route path="*" element={null} />
        </Routes>
      </main>
    </>
  );
}

export default App;
