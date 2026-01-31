import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <ModeToggle />
      <Button>Click me</Button>
    </div>
  )
}

export default App