
import './App.css'
import imgUrl from './assets/283831035-46846c93-9d66-40a6-9431-7c25bd1c8dd0.png'

function App() {
  return (
    <div class='container mx-auto px-8 flex justify-center'>
      <h1>
        <span class='sr-only'>
          GO CLEAN
        </span>
        <img src={imgUrl} class="object-cover" alt="" />
      </h1>
    </div>
  )
}

export default App
