import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

function ImageSection({ title, image, className, imageClassName }) {
  const [preview, setPreview] = useState(null);

  const src = typeof image === "string" ? image : image?.file_uri;

  return (
    <div className={`w-full ${title ? "space-y-3" : ""} ${className || ""}`}>
      {title ? <p className="text-base font-semibold">{title}</p> : null}

      {!src ? (
        <div className=" rounded-lg border border-dashed p-6 text-sm text-muted-foreground text-center">
          Chưa có hình ảnh
        </div>
      ) : (
        <img
          src={src}
          alt={title || "image"}
          onClick={() => setPreview(src)}
          className={`w-full h-60 object-cover rounded-xl border cursor-pointer transition ${imageClassName || ""}`}
        />
      )}

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-none min-w-[90vw] p-2 z-1000">
          <img
            src={preview}
            alt="preview"
            className="w-full h-[90vh] object-contain rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ImageSection;
