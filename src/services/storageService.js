import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../config/connectfb";
import { nameFielUUID } from "../utils/utils";

const uploadFile = async (imagen) => {
    try {
        const nameWithExtension = nameFielUUID(imagen.name); // Genera un nombre único
        const refArchivo = ref(storage, nameWithExtension);
        const resultado = await uploadBytes(refArchivo, imagen);
        const urlArchivo = await getDownloadURL(refArchivo); // URL pública
        return urlArchivo;
    } catch (error) {
        console.error("Error al subir la imagen:", error);
        throw error;
    }
};


const deleteFile = async (urlArchivo) => {
    try {
        const firebaseStorageDomain = "firebasestorage.googleapis.com";
        if (!urlArchivo || !urlArchivo.includes(firebaseStorageDomain)) {
            console.log("URL no asociada a Firebase Storage. Se omite la eliminación.");
            return;
        }
        const refArchivo = ref(storage, urlArchivo);
        await deleteObject(refArchivo);
        console.log("Archivo eliminado exitosamente:", urlArchivo);
    } catch (error) {
        console.error("Error al eliminar la imagen:", error);
        throw error;
    }
};

export {
    uploadFile,
    deleteFile
}