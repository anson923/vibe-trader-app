import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Calendar, Clock, Users } from "lucide-react"

export default function CoursesPage() {
  return (
    <div className="container mx-auto px-4 py-6 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Courses</h1>
        <p className="text-muted-foreground">Browse and manage your courses</p>
      </div>

      <Tabs defaultValue="enrolled" className="space-y-6">
        <TabsList>
          <TabsTrigger value="enrolled">Enrolled</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Introduction to Computer Science",
                code: "CS101",
                instructor: "Dr. Smith",
                schedule: "Mon/Wed/Fri 10:00 AM",
                students: 120,
                department: "Computer Science",
              },
              {
                title: "Calculus I",
                code: "MATH201",
                instructor: "Prof. Johnson",
                schedule: "Tue/Thu 2:00 PM",
                students: 85,
                department: "Mathematics",
              },
              {
                title: "Introduction to Psychology",
                code: "PSYC101",
                instructor: "Dr. Williams",
                schedule: "Mon/Wed 1:00 PM",
                students: 150,
                department: "Psychology",
              },
            ].map((course, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{course.title}</CardTitle>
                      <CardDescription>{course.code}</CardDescription>
                    </div>
                    <Badge>{course.department}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{course.instructor}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{course.schedule}</span>
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{course.students} students enrolled</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    View Course
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="available">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Advanced Data Structures",
                code: "CS301",
                instructor: "Dr. Brown",
                schedule: "Mon/Wed 3:00 PM",
                students: 45,
                department: "Computer Science",
              },
              {
                title: "Organic Chemistry",
                code: "CHEM202",
                instructor: "Prof. Davis",
                schedule: "Tue/Thu 11:00 AM",
                students: 60,
                department: "Chemistry",
              },
              {
                title: "World History",
                code: "HIST101",
                instructor: "Dr. Miller",
                schedule: "Mon/Wed/Fri 9:00 AM",
                students: 90,
                department: "History",
              },
            ].map((course, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{course.title}</CardTitle>
                      <CardDescription>{course.code}</CardDescription>
                    </div>
                    <Badge variant="outline">{course.department}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{course.instructor}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{course.schedule}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Registration deadline: May 15</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Enroll</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Introduction to Biology",
                code: "BIO101",
                instructor: "Dr. Garcia",
                grade: "A",
                semester: "Fall 2022",
                department: "Biology",
              },
              {
                title: "English Composition",
                code: "ENG101",
                instructor: "Prof. Wilson",
                grade: "B+",
                semester: "Spring 2023",
                department: "English",
              },
              {
                title: "Physics I",
                code: "PHYS201",
                instructor: "Dr. Taylor",
                grade: "A-",
                semester: "Fall 2023",
                department: "Physics",
              },
            ].map((course, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{course.title}</CardTitle>
                      <CardDescription>{course.code}</CardDescription>
                    </div>
                    <Badge variant="secondary">{course.department}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{course.instructor}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{course.semester}</span>
                    </div>
                    <div className="flex items-center font-medium">
                      <span>Final Grade: {course.grade}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    View Certificate
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

