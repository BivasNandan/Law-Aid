import React, { useContext } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Appcontext } from '../lib/Appcontext'
import { toast } from 'react-hot-toast'

const FileViewer = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { backendUrl } = useContext(Appcontext)

  const filePath = searchParams.get('path')
  const fileName = searchParams.get('name')
  const mimeType = searchParams.get('mime')

  // Removed fileSize constant as it was not being used in the component

  // Handle download
  const handleDownload = async () => {
    try {
      const filename = filePath.split('/').pop()
      const response = await fetch(`${backendUrl}/api/chat/download/${filename}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': '*/*'
        }
      })

      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Download started!')
    } catch (err) {
      console.error('Error downloading file:', err)
      toast.error('Failed to download file')
    }
  }

  if (!filePath) {
    navigate(-1)
    return null
  }

  const isImage = mimeType?.startsWith('image/')
  const isPDF = mimeType === 'application/pdf'

  return (
    <>
    

      {/* File Viewer - Full Screen */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-full max-h-full overflow-auto flex items-center justify-center">
          {isImage ? (
            // Image viewer - full size
            <img
              src={`${backendUrl}/${filePath}`}
              alt={fileName}
              className="max-w-full max-h-full object-contain"
            />
          ) : isPDF ? (
            // PDF viewer - full screen
            <iframe
              src={`${backendUrl}/${filePath}`}
              title={fileName}
              className="w-full h-full"
              style={{ minHeight: '100vh' }}
            />
          ) : (
            // Unsupported file type
            <div className="text-center py-24 px-4">
              <div className="text-9xl mb-6">📄</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Preview Not Available</h2>
              <p className="text-gray-600 text-lg mb-2">{fileName}</p>
              <p className="text-gray-500 text-base mb-8">File Type: {mimeType || 'Unknown'}</p>
              <button
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors"
              >
                ⬇️ Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default FileViewer


