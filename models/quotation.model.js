const mongoose = require('mongoose');
const crypto = require('crypto');

const quotationSchema = mongoose.Schema(
  {
    // PORTADA
    empresa: {
      type: String,
      required: [true, 'La empresa es obligatoria'],
      trim: true,
    },
    proyecto: {
      type: String,
      required: [true, 'El nombre del proyecto es obligatorio'],
      trim: true,
    },
    cotizacion_no: {
      type: String,
      required: [true, 'El número de cotización es obligatorio'],
      unique: true,
      trim: true,
    },
    fecha: {
      type: String,
      required: [true, 'La fecha es obligatoria'],
    },
    asesor: {
      type: String,
      required: [true, 'El asesor es obligatorio'],
    },

    // PRESENTACIÓN
    nombre_cliente: {
      type: String,
      required: [true, 'El nombre del cliente es obligatorio'],
    },

    // DIAGNÓSTICO
    diagnostico: {
      type: String,
      required: [true, 'El diagnóstico es obligatorio'],
    },
    necesidades: [String],

    // ALCANCE
    incluye: [String],
    no_incluye: [String],

    // CRONOGRAMA
    cronograma: {
      fases: [
        {
          title: String,
          descripcion: String,
          semanas: String,
        },
      ],
      total_semanas: String,
    },

    // INVERSIÓN
    inversion: {
      monto: {
        type: String,
        required: [true, 'El monto de inversión es obligatorio'],
      },
      moneda: {
        type: String,
        default: 'COP',
      },
      simbolo: {
        type: String,
        default: '$',
      },
      pagos: [
        {
          titulo: String,
          descripcion: String,
          porcentaje: Number,
        },
      ],
    },

    // CIERRE
    firmas: {
      nombre: String,
      cargo: String,
    },

    // TÉRMINOS
    terminos: [
      {
        titulo: String,
        contenido: String,
      },
    ],

    // CONTRAPORTADA
    timestamp: String,
    location: String,

    // METADATA Y CONTROL
    slug: {
      type: String,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware para generar el slug aleatorio antes de guardar
quotationSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = crypto.randomBytes(6).toString('hex'); // Genera un slug corto aleatorio (ej: 4f1a2b3c4d5e)
  }
  next();
});

const Quotation = mongoose.model('Quotation', quotationSchema);

module.exports = Quotation;
