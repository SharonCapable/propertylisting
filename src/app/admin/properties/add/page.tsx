import { PropertyForm } from "@/components/PropertyForm"
import { Header } from "@/components/Header"

export default function AddPropertyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Add New Property</h1>
          <p className="text-muted-foreground">Create a new rental property listing</p>
        </div>
        <PropertyForm />
      </main>
    </div>
  )
}
