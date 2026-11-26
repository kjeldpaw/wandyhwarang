import { Route, Routes } from 'react-router-dom';
import RequireLogin from './auth/RequireLogin';
import ClubsPage from './clubs/ClubsPage';
import Header from './Header';

function App() {
  return (
    <>
      <Header />
      <main>
        <RequireLogin>
          <Routes>
            <Route path="/" element={null} />
            <Route path="/clubs" element={<ClubsPage />} />
          </Routes>
        </RequireLogin>
      </main>
    </>
  );
}

export default App;
