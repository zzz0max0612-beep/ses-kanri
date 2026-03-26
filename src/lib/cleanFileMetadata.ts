import { PDFDocument } from 'pdf-lib'
import * as XLSX from 'xlsx'

export async function cleanPdfMetadata(file: File): Promise<File> {
  const buffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  pdfDoc.setTitle('')
  pdfDoc.setAuthor('')
  pdfDoc.setSubject('')
  pdfDoc.setKeywords([])
  pdfDoc.setProducer('')
  pdfDoc.setCreator('')
  const cleaned = await pdfDoc.save()
  return new File([cleaned], file.name, { type: 'application/pdf' })
}

export async function cleanExcelMetadata(file: File): Promise<File> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'buffer' })
  wb.Props = {
    Title: '',
    Subject: '',
    Author: '',
    Manager: '',
    Company: '',
    Category: '',
    Keywords: '',
    Comments: '',
    LastAuthor: '',
  }
  wb.Custprops = {}
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  return new File([out], file.name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export async function cleanFileMetadata(file: File): Promise<File> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  const isExcel =
    file.type.includes('spreadsheet') ||
    file.name.toLowerCase().endsWith('.xlsx') ||
    file.name.toLowerCase().endsWith('.xls')

  if (isPdf) return cleanPdfMetadata(file)
  if (isExcel) return cleanExcelMetadata(file)
  return file
}
