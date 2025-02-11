// ticket-form-app/src/App.jsx
import { Route, Routes } from 'react-router-dom';
import TicketForm from './components/TicketForm';

function App() {
  return (
    <Routes>
      <Route path="/" element={<TicketForm />} />
    </Routes>
  );
}

export default App;