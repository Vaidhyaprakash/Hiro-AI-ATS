"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Plus, Search, Filter, MoreHorizontal, Mail, Phone, 
  UserPlus, Download, Trash 
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  
  const contacts = [
    {
      id: 1,
      name: "Alex Johnson",
      email: "alex.johnson@example.com",
      phone: "+1 (555) 123-4567",
      company: "TechCorp Inc.",
      position: "Senior Developer",
      status: "Active",
      tags: ["Engineering", "React", "Remote"],
      lastContact: "2023-06-15",
    },
    {
      id: 2,
      name: "Samantha Lee",
      email: "samantha.lee@example.com",
      phone: "+1 (555) 987-6543",
      company: "Marketing Masters",
      position: "Marketing Director",
      status: "Active",
      tags: ["Marketing", "Leadership"],
      lastContact: "2023-06-10",
    },
    {
      id: 3,
      name: "David Chen",
      email: "david.chen@example.com",
      phone: "+1 (555) 456-7890",
      company: "Finance First",
      position: "Financial Analyst",
      status: "Inactive",
      tags: ["Finance", "Analysis"],
      lastContact: "2023-05-22",
    },
    {
      id: 4,
      name: "Maria Rodriguez",
      email: "maria.rodriguez@example.com",
      phone: "+1 (555) 234-5678",
      company: "Design Dynamics",
      position: "UX Designer",
      status: "Active",
      tags: ["Design", "UX/UI"],
      lastContact: "2023-06-18",
    },
    {
      id: 5,
      name: "James Wilson",
      email: "james.wilson@example.com",
      phone: "+1 (555) 876-5432",
      company: "Sales Solutions",
      position: "Sales Manager",
      status: "Active",
      tags: ["Sales", "Management"],
      lastContact: "2023-06-05",
    },
    {
      id: 6,
      name: "Emily Brown",
      email: "emily.brown@example.com",
      phone: "+1 (555) 345-6789",
      company: "HR Helpers",
      position: "HR Specialist",
      status: "Inactive",
      tags: ["HR", "Recruitment"],
      lastContact: "2023-05-30",
    },
  ]

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.position.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-semibold text-[#4b7a3e]">Contacts</h1>
        <div className="flex gap-2">
          <Button className="gap-1">
            <Plus className="h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-1">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
        <Button variant="outline" className="gap-1">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-sm text-muted-foreground">{contact.position}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span>{contact.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{contact.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{contact.company}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(contact.lastContact)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={contact.status === "Active" ? "default" : "secondary"}
                      className={contact.status === "Active" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                    >
                      {contact.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>Send Email</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            <span>Add to Job</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2 text-red-600">
                            <Trash className="h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 