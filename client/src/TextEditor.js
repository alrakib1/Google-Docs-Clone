import Quill from "quill";
import "quill/dist/quill.snow.css";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const TextEditor = () => {
  const { id: documentId } = useParams();

  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();

  useEffect(() => {
    if (!socket || !quill) return;

    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  // get document from server by id
  useEffect(() => {
    if (!socket || !quill) return;

    socket.once("load-document", (document) => {
      // console.log('document loaded', document);
      quill.setContents(document);
      quill.enable();
    });

    if (documentId) {
      // console.log("Requesting document with ID:", documentId);
      socket.emit("get-document", documentId);
    }
  }, [socket, quill, documentId]);

  // connect to socket.io server
  useEffect(() => {
    const s = io("http://localhost:3001");
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, []);

  // sending changes

  useEffect(() => {
    if (!quill || !socket) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;

      socket.emit("send-changes", delta);
    };

    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill]);

  // receiving changes

  useEffect(() => {
    if (!quill || !socket) return;

    const handler = (delta) => {
      quill.updateContents(delta);
    };

    socket.on("receive-changes", handler);

    return () => {
      socket.off("receive-changes", handler);
    };
  }, [socket, quill]);

  const TOOLBAR_OPTIONS = [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["bold", "italic", "underline"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ align: [] }],
    ["image", "blockquote", "code-block"],
    ["clean"],
    ["link"],
  ];

  // create the editor
  const wrapperRef = useCallback((wrapper) => {
    if (wrapper === null) return;
    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    });
    q.disable();
    q.setText("Loading...");
    setQuill(q);
  }, []);

  return <div className="container" ref={wrapperRef}></div>;
};

export default TextEditor;
