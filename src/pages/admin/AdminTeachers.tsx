import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

import { Loader2, Plus, Pencil, Trash2, X } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import MediaUploader from "@/components/shared/MediaUploader"

import { Database } from "@/integrations/supabase/types"

type TeacherRow =
  Database["public"]["Tables"]["teacher_profiles"]["Row"]

type TeacherInsert =
  Database["public"]["Tables"]["teacher_profiles"]["Insert"]

type ProfileOption = {
  user_id: string
  full_name: string | null
}

const emptyForm: Partial<TeacherInsert> = {
  user_id: "",
  bio: "",
  experience_years: 0,
  rating: 0,
  total_reviews: 0,
  hourly_rate: 0,
  image_url: "",
  is_available: true,
  is_featured: false
}

export default function AdminTeachers() {

  const { toast } = useToast()

  const [teachers, setTeachers] = useState<TeacherRow[]>([])
  const [profiles, setProfiles] = useState<ProfileOption[]>([])
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] =
    useState<TeacherRow | null>(null)

  const [formData, setFormData] =
    useState<Partial<TeacherInsert>>(emptyForm)

  const [saving, setSaving] = useState(false)

  const [extraFields, setExtraFields] = useState<{ key: string; value: string }[]>([])

  const addExtraField = () => setExtraFields((prev) => [...prev, { key: "", value: "" }])

  const updateExtraField = (index: number, field: "key" | "value", value: string) =>
    setExtraFields((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)))

  const removeExtraField = (index: number) =>
    setExtraFields((prev) => prev.filter((_, i) => i !== index))

  const fetchTeachers = async () => {

    setLoading(true)

    const { data, error } = await supabase
      .from("teacher_profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {

      console.error(error)

      toast({
        title: "Không tải được giảng viên",
        variant: "destructive"
      })

    }

    setTeachers(data || [])

    setLoading(false)

  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  const openNew = () => {

    setEditingTeacher(null)

    setFormData(emptyForm)

    setExtraFields([])

    setDialogOpen(true)

  }

  const openEdit = (teacher: TeacherRow) => {

    setEditingTeacher(teacher)

    setFormData({
      display_name: teacher.display_name,
      bio: teacher.bio || "",
      experience_years: teacher.experience_years || 0,
      rating: teacher.rating || 0,
      total_reviews: teacher.total_reviews || 0,
      hourly_rate: teacher.hourly_rate || 0,
      image_url: teacher.image_url || "",
      is_available: teacher.is_available ?? true,
      is_featured: teacher.is_featured ?? false
    })

    setDialogOpen(true)

  }

  const handleSave = async () => {

    if (!formData.user_id) {
      toast({
        title: "Vui lòng chọn người dùng",
        variant: "destructive"
      })
      return
    }

    setSaving(true)

    const payload: TeacherInsert = {
      user_id: formData.user_id,
      bio: formData.bio || "",

      experience_years: formData.experience_years || 0,

      rating: formData.rating || 0,

      total_reviews: formData.total_reviews || 0,

      hourly_rate: formData.hourly_rate || 0,

      image_url: formData.image_url || "",

      is_available: formData.is_available ?? true,
      is_featured: formData.is_featured ?? false
    }

    try {

      if (editingTeacher) {

        const { error } = await supabase
          .from("teacher_profiles")
          .update(payload)
          .eq("id", editingTeacher.id)

        if (error) throw error

        toast({
          title: "Đã cập nhật giảng viên"
        })

      } else {

        const { error } = await supabase
          .from("teacher_profiles")
          .insert(payload)

        if (error) throw error

        toast({
          title: "Đã tạo giảng viên"
        })

      }

      setDialogOpen(false)

      fetchTeachers()

    } catch (err) {

      console.error(err)

      toast({
        title: "Không lưu được giảng viên",
        variant: "destructive"
      })

    }

    setSaving(false)

  }

  const handleDelete = async (id: string) => {

    if (!confirm("Xóa giảng viên này?")) return

    const { error } = await supabase
      .from("teacher_profiles")
      .delete()
      .eq("id", id)

    if (!error) {

      toast({
        title: "Đã xóa giảng viên"
      })

      fetchTeachers()

    }

  }

  return (

    <div className="space-y-6">

      <div className="flex justify-between">

        <div>

          <h1 className="text-2xl font-bold">
            Quản lý giảng viên
          </h1>

          <p className="text-muted-foreground">
            Quản lý giảng viên hiển thị trên website
          </p>

        </div>

        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm giảng viên
        </Button>

      </div>

      <Card>

        <CardHeader>
          <CardTitle>Danh sách giảng viên</CardTitle>
        </CardHeader>

        <CardContent>

          {loading ? (

            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin w-6 h-6" />
            </div>

          ) : (

            <Table>

              <TableHeader>

                <TableRow>
                  <TableHead>Giảng viên</TableHead>
                  <TableHead>Kinh nghiệm</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead></TableHead>
                </TableRow>

              </TableHeader>

              <TableBody>

                {teachers.map((teacher) => (

                  <TableRow key={teacher.id}>

                    <TableCell>

                      <div className="flex gap-3 items-center">

                        <img
                          src={
                            teacher.image_url ||
                            "/avatar.png"
                          }
                          className="w-10 h-10 rounded-full object-cover"
                        />

                        <div>

                          <div className="font-medium">
                            {profiles.find((p) => p.user_id === teacher.user_id)?.full_name || teacher.user_id}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {teacher.bio?.slice(0, 40)}
                          </div>

                        </div>

                      </div>

                    </TableCell>

                    <TableCell>
                      {teacher.experience_years || 0} năm
                    </TableCell>

                    <TableCell>
                      {teacher.is_featured ? "⭐" : "-"}
                    </TableCell>

                    <TableCell className="space-x-2">

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          openEdit(teacher)
                        }
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() =>
                          handleDelete(teacher.id)
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>

                    </TableCell>

                  </TableRow>

                ))}

              </TableBody>

            </Table>

          )}

        </CardContent>

      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>

        <DialogContent className="max-w-xl">

          <DialogHeader>
            <DialogTitle>
              {editingTeacher
                ? "Chỉnh sửa giảng viên"
                : "Thêm giảng viên"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">

            <div>

              <Label>Người dùng</Label>

              <select
                value={formData.user_id || ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    user_id: e.target.value
                  }))
                }
                className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Chọn người dùng --</option>
                {profiles.map((profile) => (
                  <option key={profile.user_id} value={profile.user_id}>
                    {profile.full_name || profile.user_id}
                  </option>
                ))}
              </select>

            </div>

            <div>

              <Label>Giới thiệu</Label>

              <Textarea
                value={formData.bio || ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    bio: e.target.value
                  }))
                }
              />

            </div>

            <div>

              <Label>Ảnh</Label>

              <MediaUploader
                value={formData.image_url || ""}
                onChange={(url) =>
                  setFormData((p) => ({
                    ...p,
                    image_url: url
                  }))
                }
                folder="teachers"
              />

            </div>

            <div className="space-y-3">

              <Label>Fields tùy chỉnh</Label>

              {extraFields.map((field, index) => (

                <div
                  key={index}
                  className="flex gap-2"
                >

                  <Input
                    placeholder="field"
                    value={field.key}
                    onChange={(e) =>
                      updateExtraField(
                        index,
                        "key",
                        e.target.value
                      )
                    }
                  />

                  <Input
                    placeholder="value"
                    value={field.value}
                    onChange={(e) =>
                      updateExtraField(
                        index,
                        "value",
                        e.target.value
                      )
                    }
                  />

                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() =>
                      removeExtraField(index)
                    }
                  >
                    <X className="w-4 h-4" />
                  </Button>

                </div>

              ))}

              <Button
                variant="secondary"
                onClick={addExtraField}
              >
                + Thêm field
              </Button>

            </div>

          </div>

          <DialogFooter>

            <Button
              variant="secondary"
              onClick={() => setDialogOpen(false)}
            >
              Hủy
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving}
            >

              {saving && (
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
              )}

              Lưu

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>

  )

}