import CustomModal from "@/components/CustomModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import peticion from "@/services/axiosConfig";
import { MoonIcon, QrCode, SunIcon } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
// import { FaFacebook, FaGlobe, FaInstagram, FaLinkedin, FaWhatsapp } from 'react-icons/fa'
import Swal from "sweetalert2";
import { z } from "zod";
import { saveAs } from "file-saver";

const { VITE_DEV_URL, VITE_PRODUCTION_URL, VITE_DEBUG } = import.meta.env;
const URL_PETICION = VITE_DEBUG == "true" ? VITE_DEV_URL : VITE_PRODUCTION_URL;

// Esquema Zod para validar datos
export const QRSchema = z.object({
  id: z.number().min(1).optional(),
  url: z.string(),
  urlToRedirect: z
    .string()
    .url(
      "El campo URL de redirección debe contener una URL válida como 'https://www.google.com'."
    ),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  category: z.string().min(3, "La categoría debe tener al menos 3 caracteres."),
  description: z.string().optional(),
});
export type IQR = z.infer<typeof QRSchema>;

interface IPagination {
  page: number;
  limit: number;
  search_term: string;
  total: number;
}

const urlServer = `${URL_PETICION}/ramos_qr/permalink/`;

const RamosQR = () => {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [allQR, setAllQR] = useState<IQR[]>([]);
  const [selectedQr, setSelectedQr] = useState<IQR | null>(null);
  const [isCreatingOrEditing, setIsCreatingOrEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pagination, setPagination] = useState<IPagination>({
    page: 1,
    limit: 6,
    search_term: "",
    total: 0,
  });
  const [formValues, setFormValues] = useState<IQR>({
    name: "",
    description: "",
    category: "",
    url: "",
    urlToRedirect: "",
  });

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
    setDarkMode(!darkMode);
  };

  // Función para obtener todos los QR desde el backend
  const handleGetAllQR = async (pagination: IPagination) => {
    setIsLoading(true);

    try {
      const response = await peticion.get(
        `/ramos_qr?page=${pagination.page}&limit=${pagination.limit}&search_term=${pagination.search_term}`
      );
      if (response.data?.status_code == 200) {
        setAllQR(response.data?.data);
        setPagination({
          ...pagination,
          page: response.data?.pagination?.page,
          limit: response.data?.pagination?.limit,
          total: response.data?.pagination?.total,
        });
      }
    } catch (error) {
      console.error("Error al obtener QR:", error);
      Swal.fire("Error", "No se pudieron obtener los QR", "error");
    } finally {
      setIsLoading(false);
    }
  };
  const handleSaveOrEditQR = async () => {
    try {
      setIsLoading(true);
      QRSchema.parse(formValues);
      setErrors({});

      if (selectedQr?.id) {
        // Editar QR
        await peticion.put(`/ramos_qr/${selectedQr?.id}`, formValues);
        Swal.fire("Éxito", "QR editado correctamente", "success");
      } else {
        // Crear QR
        await peticion.post("/ramos_qr", formValues);
        Swal.fire("Éxito", "QR creado correctamente", "success");
      }

      setIsCreatingOrEditing(false); // Cierra el formulario
      handleGetAllQR(pagination); // Refresca la lista
    } catch (error: any) {
      // Manejo de errores de validación (Zod)
      if (error.name === "ZodError") {
        const zodErrors = error.errors.reduce(
          (acc: Record<string, string>, err: any) => {
            acc[err.path[0]] = err.message; // Agrupa errores por campo
            return acc;
          },
          {}
        );
        setErrors(zodErrors); // Actualiza los errores en el estado
        Swal.fire(
          "Error",
          "Hay errores en el formulario. Por favor corrige los campos.",
          "error"
        );
      } else {
        // Manejo de errores de la API o generales
        Swal.fire(
          "Error",
          error.response?.data?.message || "Error al guardar el QR",
          "error"
        );
      }
    } finally {
      setIsLoading(false); // Siempre quita el indicador de carga
    }
  };

  // Eliminar QR
  const handleDeleteQR = async (id: number) => {
    try {
      await peticion.delete(`/ramos_qr/${id}`);
      Swal.fire("Éxito", "QR eliminado correctamente", "success");
      handleGetAllQR(pagination); // Refrescar la lista
    } catch (error) {
      console.error("Error al eliminar QR:", error);
      Swal.fire("Error", "No se pudo eliminar el QR", "error");
    }
  };

  const handleSearch = (value: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      handleGetAllQR({ ...pagination, search_term: value });
    }, 600);

    setTimeoutId(newTimeoutId);
  };

  useEffect(() => {
    handleGetAllQR(pagination);
  }, []);

  console.log(
    selectedQr,
    "selectedQr",
    formValues,
    "formValues",
    errors,
    "errors"
  );
  return (
    <div className="min-h-screen max-w-6xl w-auto m-auto flex flex-col gap-3 bg-gray-100 dark:bg-gray-700 p-4 text-gray-800 dark:text-gray-100">
      <CustomModal
        isOpen={isOpenModal}
        onClose={function (): void {
          setIsOpenModal(false);
        }}
        title={selectedQr?.name + " - " + selectedQr?.category}
        children={
          <>
            <div>
              <QRGenerator link={selectedQr?.urlToRedirect || ""} />
            </div>
          </>
        }
      />
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500 text-white rounded-b-lg shadow-md">
        <h1 className="text-4xl font-bold mb-4">Ramos QR</h1>
        <p className="text-lg text-center max-w-md">
          Simplifica la gestión de tus códigos QR con una interfaz minimalista y
          funcional.
        </p>
      </div>

      {isCreatingOrEditing && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col gap-3">
          {/* URL */}
          <div>
            <Label>URL (Para compartir)</Label>
            <Input
              placeholder="URL share"
              disabled
              value={`${urlServer}${formValues?.category || ""}`}
            />
            {errors?.url && (
              <p className="text-red-500 md:text-sm">{errors.url}</p>
            )}
          </div>

          {/* URL de redirección */}
          <div className="flex flex-col gap-3">
            <Label>URL destino (Hacia donde va)</Label>
            <Input
              placeholder="URL destino"
              value={formValues?.urlToRedirect || ""}
              onChange={(e) =>
                setFormValues({ ...formValues, urlToRedirect: e.target.value })
              }
            />
            {errors?.urlToRedirect && (
              <p className="text-red-500 md:text-sm">{errors.urlToRedirect}</p>
            )}
          </div>

          {/* Nombre y Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-3">
              <Label>Nombre</Label>
              <Input
                placeholder="Nombre"
                value={formValues?.name || ""}
                onChange={(e) =>
                  setFormValues({ ...formValues, name: e.target.value })
                }
              />
              {errors?.name && (
                <p className="text-red-500 md:text-sm">{errors.name}</p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Label>Categoría</Label>
              <Input
                placeholder="Categoría"
                value={formValues?.category || ""}
                onChange={(e) =>
                  setFormValues({ ...formValues, category: e.target.value })
                }
              />
              {errors?.category && (
                <p className="text-red-500 md:text-sm">{errors.category}</p>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-3">
            <Label>Descripción</Label>
            <Textarea
              name="description"
              placeholder="Descripción"
              value={formValues?.description || ""}
              onChange={(e) =>
                setFormValues({ ...formValues, description: e.target.value })
              }
            />
            {errors?.description && (
              <p className="text-red-500 md:text-sm">{errors.description}</p>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <Button
              onClick={handleSaveOrEditQR}
              disabled={isLoading}
              className="mt-4"
            >
              {selectedQr?.id ? "Editar" : "Guardar"}
            </Button>
            <Button
              onClick={() => {
                setIsCreatingOrEditing(false);
                setFormValues({
                  name: "",
                  description: "",
                  category: "",
                  url: "",
                  urlToRedirect: "",
                } as IQR);
                setSelectedQr(null);
              }}
              className="mt-4 bg-red-500 hover:bg-red-600"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="py-8 px-4">
        <div className="max-w-2xl mx-auto flex gap-4 items-center">
          <Input
            type="text"
            onChange={(e) => {
              handleSearch(e.target.value);
            }}
            placeholder="Buscar QR..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-blue-500"
          />
          <Button
            onClick={() => {
              setIsCreatingOrEditing(true);
              setSelectedQr(null);
            }}
            disabled={isLoading}
          >
            Crear
          </Button>
          {/* Dark Mode Toggle */}
          <div>
            <Button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 hover:dark:bg-gray-900 shadow"
            >
              {darkMode ? (
                <SunIcon className="h-6 w-6 text-yellow-400" />
              ) : (
                <MoonIcon className="h-6 w-6 text-gray-800 dark:text-gray-200" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 max-w-3xl">
        {/* Tabla */}
        <table className="min-w-full text-left bg-white dark:bg-gray-800 hover:dark:bg-gray-900 rounded-lg shadow-lg ">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                ID
              </th>
              <th className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Nombre
              </th>
              <th className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                URL (Para compartir)
              </th>
              <th className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Categoría
              </th>
              <th className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                URL destino (Hacia donde va)
              </th>
              <th className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="   overflow-x-auto ">
            {allQR?.map((qr) => (
              <tr
                key={qr?.id}
                className="border-t dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">
                  {qr?.id}
                </td>
                <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200 truncate max-w-[150px]">
                  {qr?.name}
                </td>
                <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                  <a
                    href={`${urlServer}${qr?.category || ""}/${qr?.name || ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Copiar
                  </a>
                </td>
                <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">
                  {qr?.category}
                </td>
                <td>{qr?.urlToRedirect}</td>
                <td className="px-4 py-2 flex   gap-2">
                  <Button
                    onClick={() => {
                      setSelectedQr(qr);
                      setIsCreatingOrEditing(true);
                      setFormValues(qr);
                    }}
                    disabled={isLoading}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Editar
                  </Button>
                  <Button
                    onClick={() => handleDeleteQR(qr?.id || 0)}
                    disabled={isLoading}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Eliminar
                  </Button>
                  <Button
                    onClick={() => {
                      setIsOpenModal(true);
                      setSelectedQr(qr);
                    }}
                    disabled={isLoading}
                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Ver
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginación */}
        <div className="mt-4 flex items-center justify-between">
          <Button
            onClick={() => {
              if (pagination.page > 1) {
                const newPage = pagination.page - 1;
                setPagination({ ...pagination, page: newPage });
                handleGetAllQR({ ...pagination, page: newPage });
              }
            }}
            disabled={pagination.page === 1}
            className="px-3 py-1 text-sm  rounded-lg   disabled:opacity-50"
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Página {pagination.page} de{" "}
            {Math.ceil(pagination?.total / pagination.limit)}
          </span>
          <Button
            onClick={() => {
              if (
                pagination.page <
                Math.ceil(pagination?.total / pagination.limit)
              ) {
                const newPage = pagination.page + 1;
                setPagination({ ...pagination, page: newPage });
                handleGetAllQR({ ...pagination, page: newPage });
              }
            }}
            disabled={
              pagination.page >= Math.ceil(pagination?.total / pagination.limit)
            }
            className="px-3 py-1 text-sm  rounded-lg  "
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RamosQR;

type QRGeneratorProps = {
  link: string;
  styles?: React.CSSProperties;
  size?: number;
  bgColor?: string;
  fgColor?: string;
};

// import html2canvas from "html2canvas";
const QRGenerator: React.FC<QRGeneratorProps> = ({
  link,
  // icons,
  styles,
  size = 256,
  bgColor = "#ffffff",
  fgColor = "#00a2df",
}) => {
  const iconSize = size * 0.15; // Proporcional al tamaño del QR
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Descargar QR como imagen
  const handleDownloadQR = () => {
    const canvas = qrCanvasRef.current;
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, "qr-code.png"); // Descarga el archivo como "qr-code.png"
        }
      });
    }
  };
  return (
    <div className="flex flex-col gap-4 items-center">
      <div
        className="relative flex items-center justify-center"
        style={{ ...styles }}
      >
        {/* QR Code */}
        <QRCodeCanvas
          value={link}
          size={size}
          bgColor={bgColor}
          fgColor={fgColor}
          level="H" // Nivel de corrección de errores alto
          marginSize={2}
          ref={qrCanvasRef}
        />
        {/* Ícono en el centro */}
        <div
          className="absolute flex items-center justify-center bg-white rounded-full"
          style={{
            // width: iconSize + 16,
            // height: iconSize + 16,
            width: iconSize + 14,
            height: iconSize + 14,
          }}
        >
          <QrCode size={35} className="text-teal-400" />
          {/* Icono */}
        </div>
      </div>
      <Button
        onClick={handleDownloadQR}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Descargar QR
      </Button>
    </div>
  );
};
