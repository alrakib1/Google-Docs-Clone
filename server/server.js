require("dotenv").config();
const mongoose = require("mongoose");
const Document = require("./Document");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("db connected"))
  .catch((err) => console.log(err));

const defaultData = "";

const io = require("socket.io")(3001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    // console.log("Request for document with ID:", documentId);
    const document = await findORCreateDocument(documentId);
    // console.log("Found or created document:", document);
    socket.join(documentId);
    socket.emit("load-document", document.data);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
    //   console.log("Saving document:", data);
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

const findORCreateDocument = async (id) => {
  if (id == null) return;
  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, data: defaultData });
};
