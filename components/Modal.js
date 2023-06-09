import React from "react"

//MODAL WHICH WE CAN IMPLEMENT IN OTHER COMPONENTS
const Modal = ({ isVisible, onClose, children }) => {
    if (!isVisible) return null

    const handleClose = e => {
        if (e.target.id === "wrapper") onClose()
    }

    return (
        <div
            className="fixed inset-0 bg-opacity backdrop-blur-sm flex justify-center items-center"
            id="wrapper"
            onClick={handleClose}
        >
            <div className="w-[600px] flex flex-col">
                <button className="text-white text-xl place-self-end" onClick={() => onClose()}>
                    X
                </button>
                <div className="bg-amber-50 p-8 rounded text-center">{children}</div>
            </div>
        </div>
    )
}

export default Modal
