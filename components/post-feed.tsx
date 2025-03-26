"use client"

import { useEffect, useState } from "react"
import Post from "@/components/post"
import { Skeleton } from "@/components/ui/skeleton"

// Sample post data
const samplePosts = [
  {
    id: "1",
    author: {
      name: "Professor Smith",
      username: "prof_smith",
      avatar: "/user_icon.svg",
    },
    content:
      "Just posted the lecture notes for today's class on quantum mechanics. Make sure to review them before the next session! #physics #quantummechanics",
    timestamp: "2h ago",
    image: "/user_icon.svg",
    likes: 42,
    comments: 8,
    shares: 3,
    department: "Physics",
  },
  {
    id: "2",
    author: {
      name: "Student Council",
      username: "student_council",
      avatar: "/user_icon.svg",
    },
    content:
      "Reminder: The spring festival is next week! Join us for food, music, and fun activities across campus. Don't forget to register for the talent show by Friday. #springfestival #campuslife",
    timestamp: "4h ago",
    likes: 128,
    comments: 24,
    shares: 45,
    department: "Student Affairs",
  },
  {
    id: "3",
    author: {
      name: "University Library",
      username: "uni_library",
      avatar: "/user_icon.svg",
    },
    content:
      "Extended hours start today! The library will be open until 2 AM for the final exam period. Study rooms can be reserved online. Coffee and snacks available at the café. #finals #studyhard",
    timestamp: "6h ago",
    image: "/user_icon.svg",
    likes: 76,
    comments: 12,
    shares: 8,
    department: "Library Services",
  },
  {
    id: "4",
    author: {
      name: "Dr. Johnson",
      username: "dr_johnson",
      avatar: "/user_icon.svg",
    },
    content:
      "Excited to announce that our research team has received a $2M grant for our work on sustainable energy solutions! Looking for graduate students interested in joining the project. #research #sustainability",
    timestamp: "12h ago",
    likes: 215,
    comments: 43,
    shares: 67,
    department: "Engineering",
  },
  {
    id: "5",
    author: {
      name: "Campus Athletics",
      username: "campus_athletics",
      avatar: "/user_icon.svg",
    },
    content:
      "Big win for our basketball team last night! Congratulations to all players and coaches. Next game is Saturday at 7 PM. Come support your university team! #goteam #victory",
    timestamp: "1d ago",
    image: "/user_icon.svg",
    likes: 342,
    comments: 56,
    shares: 89,
    department: "Athletics",
  },
  {
    id: "6",
    author: {
      name: "Career Center",
      username: "career_center",
      avatar: "/user_icon.svg",
    },
    content:
      "The annual job fair is coming up next month! Over 50 companies will be on campus recruiting for internships and full-time positions. Update your resume and prepare your elevator pitch! #careers #jobfair",
    timestamp: "1d ago",
    likes: 98,
    comments: 32,
    shares: 41,
    department: "Career Services",
  },
  {
    id: "7",
    author: {
      name: "Computer Science Dept",
      username: "cs_department",
      avatar: "/user_icon.svg",
    },
    content:
      "Congratulations to our programming team for winning the regional hackathon! Their project on AI-assisted accessibility tools impressed all the judges. #computerscience #hackathon",
    timestamp: "2d ago",
    image: "/user_icon.svg",
    likes: 187,
    comments: 28,
    shares: 52,
    department: "Computer Science",
  },
]

export default function PostFeed() {
  const [posts, setPosts] = useState<typeof samplePosts>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading and randomize posts
    const timer = setTimeout(() => {
      const shuffledPosts = [...samplePosts].sort(() => Math.random() - 0.5)
      setPosts(shuffledPosts)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <Skeleton className="h-48 w-full mb-4 rounded-md" />
            <div className="flex justify-between">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  )
}

