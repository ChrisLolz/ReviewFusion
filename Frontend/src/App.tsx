import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header/Header'
import Homepage from './components/Homepage/Homepage'
import Results from './components/Results/Results'

const App = () => {
  
  return (
    <>
      <Header/>
      <Routes>
        <Route path='/' element={<Homepage/>} />
        <Route path='/search' element={<Results />} />
        <Route path='*' element={<Navigate to='/' />} />
      </Routes>
    </>
  )
}

export default App
