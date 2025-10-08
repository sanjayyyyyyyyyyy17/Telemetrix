import { Link } from "react-router-dom"

export default function NavBar() {
  return (
    <nav className="fixed top-0 w-full bg-black/70 backdrop-blur-sm z-50 text-white flex justify-between items-center px-8 py-4">
      <Link to="/" className="text-xl font-bold tracking-wider">
        RacingView
      </Link>
      <div className="space-x-6 hidden md:block">
        <a href="#features" className="hover:text-[#00BFFF]">Features</a>
        <a href="#download" className="hover:text-[#00BFFF]">Download</a>
        <Link to="/login" className="hover:text-[#00BFFF]">Login</Link>
      </div>
      <Link
        to="/login"
        className="bg-[#00BFFF] text-black px-4 py-2 rounded font-semibold hover:brightness-110 transition"
      >
        Get Started
      </Link>
    </nav>
  )
}
