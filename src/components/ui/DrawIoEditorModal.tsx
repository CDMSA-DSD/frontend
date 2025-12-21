"use client";

import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface DrawIoEditorModalProps {
    isOpen: boolean
    initialXml: string
    onSave: (xml: string) => void
    onClose: () => void
    title?: string
}

export default function DrawIoEditorModal({ isOpen, initialXml, onSave, onClose, title }: DrawIoEditorModalProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null)

    useEffect(() => {
        if (!isOpen) return

        const handleMessage = (event: MessageEvent) => {
            if (!event.origin.includes('diagrams.net')) return

            try {
                const data = JSON.parse(event.data)

                if (data.event === 'init') {
                    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({
                        action: 'load',
                        xml: initialXml || ""
                    }), '*')
                }

                if (data.event === 'save') {
                    if (data.xml) {
                        onSave(data.xml);
                        onClose();
                    }
                }

                if (data.event === 'exit') {
                    onClose()
                }
            } catch (e) {
            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [isOpen, initialXml, onSave, onClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full h-full max-w-7xl max-h-[90vh] rounded-xl overflow-hidden flex flex-col shadow-2xl border border-violet-200">
                <div className="p-4 border-b flex justify-between items-center bg-violet-50">
                    <h3 className="font-bold text-violet-900">{title || "Diagram Editor"}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-violet-200 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-violet-700" />
                    </button>
                </div>

                <div className="flex-1 bg-gray-100">
                    <iframe
                        ref={iframeRef}
                        className="w-full h-full border-none"
                        src="https://embed.diagrams.net/?embed=1&ui=atlas&spin=1&proto=json"
                    />
                </div>
            </div>
        </div>
    )
}