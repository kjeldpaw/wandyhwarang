import { Route, Routes } from 'react-router-dom';
import RequireLogin from './auth/RequireLogin';
import ClubsPage from './clubs/ClubsPage';
import Header from './Header';
import MemberListPage from './members/MemberListPage';
import MemberPage from './members/MemberPage';
import NewMemberPage from './members/NewMemberPage';
import NotFound from './NotFound';

function App() {
  return (
    <>
      <Header />
      <main>
        <RequireLogin>
          <Routes>
            <Route path="/" element={<MemberListPage />} />
            <Route path="/members/new" element={<NewMemberPage />} />
            <Route path="/members/:id" element={<MemberPage />} />
            <Route path="/clubs" element={<ClubsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </RequireLogin>
      </main>
    </>
  );
}

export default App;
