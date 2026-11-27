import { Route, Routes } from 'react-router-dom';
import RequireLogin from './auth/RequireLogin';
import ClubsPage from './clubs/ClubsPage';
import EditMemberPage from './members/EditMemberPage';
import Header from './Header';
import MemberListPage from './members/MemberListPage';
import MemberPage from './members/MemberPage';
import NewMemberPage from './members/NewMemberPage';
import NotFound from './NotFound';

function App() {
  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <div className="container">
          <RequireLogin>
            <Routes>
              <Route path="/" element={<MemberListPage />} />
              <Route path="/members/new" element={<NewMemberPage />} />
              <Route path="/members/:id" element={<MemberPage />} />
              <Route path="/members/:id/edit" element={<EditMemberPage />} />
              <Route path="/clubs" element={<ClubsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RequireLogin>
        </div>
      </main>
    </div>
  );
}

export default App;
