"use client"

import React from "react"
import { Toastr } from "@sparrowengg/twigs-react"

export function ToastrProvider() {
  return <Toastr duration={10000} />
} 