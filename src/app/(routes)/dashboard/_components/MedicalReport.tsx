
'use client'

import React, { useRef, useState } from 'react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { SessionParams } from '../medical-voice/[sessionId]/page'

type Props = {
  history: SessionParams[]
}

function MedicalReport({ history }: Props) {
  const tableRef = useRef(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const filteredHistory = history.filter((report) =>
    report.selectedDoctor.name.toLowerCase().includes(search.toLowerCase()) ||
    report.note?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage)
  const currentItems = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const exportToPDF = async () => {
    if (!tableRef.current) return
    const canvas = await html2canvas(tableRef.current)
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('landscape', 'mm', 'a4')
    const imgProps = pdf.getImageProperties(imgData)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save('medical-report.pdf')
  }

  const handleDownload = (report: SessionParams) => {
    const doc = new jsPDF()
    let y = 10

    doc.setFontSize(16)
    doc.text('Medical Report', 10, y)
    y += 10

    doc.setFontSize(12)
    doc.text(`Session ID: ${report.id || 'N/A'}`, 10, y)
    y += 8
    doc.text(`AI Assistant: ${report.selectedDoctor?.name || 'N/A'}`, 10, y)
    y += 8
    doc.text(`User: ${report.report?.user || 'N/A'}`, 10, y)
    y += 8
    doc.text(`Date: ${new Date(report.createdOn).toLocaleString()}`, 10, y)
    y += 8

    doc.text(`Main Complaint: ${report.note || 'N/A'}`, 10, y)
    y += 8
    doc.text(`Symptoms: ${report.report?.symptoms?.join(', ') || 'N/A'}`, 10, y)
    y += 8
    doc.text(`Duration: ${report.report?.duration || 'N/A'}`, 10, y)
    y += 8
    doc.text(`Severity: ${report.report?.severity || 'N/A'}`, 10, y)
    y += 8
    doc.text(`Medications Mentioned: ${report.report?.medicationsMentioned?.join(', ') || 'N/A'}`, 10, y)
    y += 8
    doc.text(`Recommendations: ${report.report?.recommendations?.join(', ') || 'N/A'}`, 10, y)
    y += 8


    const summary = report.report?.summary || 'N/A'
    const splitSummary = doc.splitTextToSize(`Summary: ${summary}`, 180)
    doc.text(splitSummary, 10, y)
    y += splitSummary.length * 8


    doc.save(`medical_report_${report.id || Date.now()}.pdf`)
  }


  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.h2
        className="text-3xl font-bold mb-8 text-center bg-gradient-to-br from-purple-100 to-blue-200 bg-clip-text text-transparent"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Medical Report History
      </motion.h2>

      <motion.div
        className="w-full max-w-6xl bg-gray-800 rounded-2xl shadow-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <input
            type="text"
            placeholder="Search doctor or notes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 w-full md:w-1/2"
          />
          <Button onClick={exportToPDF} variant="secondary" className="w-full md:w-auto">
            Export to PDF
          </Button>
        </div>

        <div ref={tableRef} className="overflow-x-auto rounded-xl">
          <Table className="min-w-full text-white">
            <TableCaption className="text-gray-400">
              A list of your recent medical reports.
            </TableCaption>
            <TableHeader>
              <TableRow className="bg-gray-700">
                <TableHead className="text-white">AI Assistant</TableHead>
                <TableHead className="text-white">Description</TableHead>
                <TableHead className="text-white">Date</TableHead>
                <TableHead className="text-white text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400">
                    No reports found.
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((report, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-700 transition-all"
                  >
                    <TableCell className="font-medium">{report.selectedDoctor?.name || 'N/A'}</TableCell>
                    <TableCell>{report.note || '—'}</TableCell>
                    <TableCell>{new Date(report.createdOn).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(report)}>
                        Download
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Previous
          </Button>
          <p className="text-white">
            Page {currentPage} of {totalPages}
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default MedicalReport
