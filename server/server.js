require("dotenv").config();

const mongoose = require("mongoose");

const Document = require("./Document");

const PORT = process.env.PORT || 3001;

const io = require("socket.io")(3001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("db connected"))
  .catch((err) => console.log(err));

const defaultData = "";

io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.data);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

const findOrCreateDocument = async (id) => {
  if (id == null) return;
  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, data: defaultData });
};
