"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { CopyIcon, UserPlusIcon, UsersIcon } from "lucide-react";
import { toast } from "sonner";

import { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUserByEmail } from "@/app/documents/[documentId]/action";

interface ShareDialogProps {
  documentId: Id<"documents">;
  initialLinkAccess?: "viewer" | "editor" | "none";
  children: React.ReactNode;
}

export const ShareDialog = ({ documentId, initialLinkAccess = "none", children }: ShareDialogProps) => {
  const updateLinkAccess = useMutation(api.documents.updateLinkAccess);
  const addCollaborator = useMutation(api.documents.addCollaborator);

  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [email, setEmail] = useState("");
  const [linkAccess, setLinkAccess] = useState<"viewer" | "editor" | "none">(initialLinkAccess);

  const onCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Đã sao chép link tài liệu");
  };

  const onLinkAccessChange = (value: "viewer" | "editor" | "none") => {
    setLinkAccess(value);
    setIsUpdating(true);
    updateLinkAccess({ id: documentId, linkAccess: value })
      .then(() => toast.success("Đã cập nhật quyền chia sẻ qua link"))
      .catch(() => toast.error("Lỗi cập nhật quyền"))
      .finally(() => setIsUpdating(false));
  };

  const onInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsUpdating(true);
    try {
      const user = await getUserByEmail(email.trim());
      if (!user) {
        toast.error("Không tìm thấy người dùng với email này");
        return;
      }
      
      await addCollaborator({ id: documentId, userId: user.id, role: "editor" });
      toast.success("Đã mời người dùng làm Editor");
      setEmail("");
    } catch {
      toast.error("Lỗi khi mời người dùng");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Share document</DialogTitle>
          <DialogDescription>
            Chia sẻ tài liệu cho người khác xem hoặc chỉnh sửa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onInvite} className="flex items-center gap-2 mt-4">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Nhập email người dùng..."
            type="email"
            disabled={isUpdating}
          />
          <Button type="submit" disabled={isUpdating}>
            <UserPlusIcon className="w-4 h-4 mr-2" />
            Invite
          </Button>
        </form>

        <div className="bg-muted p-4 rounded-md mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <UsersIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Truy cập qua link (Anyone with the link)</p>
              <p className="text-xs text-muted-foreground">Ai có link này cũng có thể truy cập</p>
            </div>
          </div>
          <Select
            value={linkAccess}
            onValueChange={onLinkAccessChange}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Restricted</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onCopyLink}>
            <CopyIcon className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
