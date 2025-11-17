// Stub components para completar a timeline

interface TimelineWaveformProps {
	audioUrl: string
	startTime: number
	duration: number
	pixelsPerSecond: number
	height: number
}

interface TimelineMarkersProps {
	markers: Array<{ id: string; time: number; label?: string }>
	pixelsPerSecond: number
	scrollX: number
	height: number
}

interface TimelineKeyframesProps {
	elementId: string
	currentTime: number
	zoom: number
	scrollX: number
	pixelsPerSecond: number
	readOnly?: boolean
}

interface TimelinePropertyPanelProps {
	elementId: string
	onClose: () => void
	readOnly?: boolean
}

interface CollaboratorPresence {
	id: string
	name: string
	color: string
	cursorX?: number
}

interface TimelineCollaborationOverlayProps {
	collaborators: CollaboratorPresence[]
	scrollX: number
	pixelsPerSecond: number
}

export const TimelineWaveform = (props: TimelineWaveformProps) => {
	void props
	return null
}

export const TimelineMarkers = (props: TimelineMarkersProps) => {
	void props
	return null
}

export const TimelineKeyframes = (props: TimelineKeyframesProps) => {
	void props
	return null
}

export const TimelinePropertyPanel = (props: TimelinePropertyPanelProps) => {
	void props
	return null
}

export const TimelineCollaborationOverlay = (props: TimelineCollaborationOverlayProps) => {
	void props
	return null
}