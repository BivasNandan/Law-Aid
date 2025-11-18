import React, { useContext, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Appcontext } from '../lib/Appcontext'
import { toast } from 'react-hot-toast'

const FileViewer = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { backendUrl, userData, loading: appLoading } = useContext(Appcontext)

  const filePath = searchParams.get('path')
  const fileName = searchParams.get('name')
  const mimeType = searchParams.get('mime')

  useEffect(() => {
    if (!filePath) {
      toast.error('No file specified')
      navigate(-1)
    }
  }, [filePath, navigate])

  if (appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!userData) {
    navigate('/login', { replace: true })
    return null
  }

  if (!filePath) return null

  const isImage = mimeType?.startsWith('image/')
  const isPDF = mimeType === 'application/pdf'

  return (
    <div className="w-full h-screen overflow-hidden bg-black flex items-center justify-center">

      {isImage ? (
        <img
          src={`${backendUrl}/${filePath}`}
          alt={fileName}
          className="w-full h-full object-contain bg-black"
        />
      ) : isPDF ? (
        <iframe
          src={`${backendUrl}/${filePath}`}
          title={fileName}
          className="w-full h-full"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-center text-white p-6">
          <div className="text-9xl">📄</div>
          <h2 className="text-3xl font-bold mt-6">Preview Not Available</h2>
          <p className="text-lg mt-3">{fileName}</p>
          <p className="text-gray-300 mt-2">File Type: {mimeType || 'Unknown'}</p>
        </div>
      )}

    </div>
  )
}

export default FileViewer
