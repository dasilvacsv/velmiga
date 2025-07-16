// components/auth/Form.tsx

'use client'

import React, { useState } from 'react';
import {
    DefaultValues,
    FieldValues,
    Path,
    SubmitHandler,
    useForm,
    UseFormReturn,
} from "react-hook-form";
import { ZodType } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon, Loader2 } from 'lucide-react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FIELD_NAMES, FIELD_TYPES } from './contants';

interface Props<T extends FieldValues> {
    schema: ZodType<T>;
    defaultValues: T;
    onSubmit: (data: T) => Promise<{ success: boolean; error?: string }>;
    type: "SIGN_IN" | "SIGN_UP";
}

const AuthForm = <T extends FieldValues>({
    type,
    schema,
    defaultValues,
    onSubmit,
}: Props<T>) => {
    const router = useRouter();
    const isSignIn = type === "SIGN_IN";
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form: UseFormReturn<T> = useForm({
        resolver: zodResolver(schema),
        defaultValues: defaultValues as DefaultValues<T>,
    });
    
    const handleSubmit: SubmitHandler<T> = async (data) => {
        setIsSubmitting(true);
        try {
            const result = await onSubmit(data);
        
            if (result.success) {
                toast.success(isSignIn
                    ? "Has iniciado sesión correctamente."
                    : "Tu cuenta ha sido creada exitosamente."
                );
                router.push("/dashboard");
            } else {
                toast.error(result.error || "Ocurrió un error inesperado.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto border-none shadow-none">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">
                    {isSignIn ? "Bienvenido de nuevo" : "Crea una cuenta"}
                </CardTitle>
                <CardDescription>
                    {isSignIn
                        ? "Accede para gestionar tus expedientes."
                        : "Completa los campos para registrarte."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-6"
                    >
                        {Object.keys(defaultValues).map((fieldName) => (
                            <FormField
                                key={fieldName}
                                control={form.control}
                                name={fieldName as Path<T>}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {FIELD_NAMES[fieldName as keyof typeof FIELD_NAMES]}
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    required
                                                    type={
                                                        field.name === 'password'
                                                            ? (showPassword ? 'text' : 'password')
                                                            : FIELD_TYPES[field.name as keyof typeof FIELD_TYPES]
                                                    }
                                                    {...field}
                                                    className="h-11"
                                                />
                                                {field.name === 'password' && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                                    </Button>
                                                )}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ))}

                        <Button 
                            type="submit" 
                            className="w-full h-11"
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting 
                                ? (isSignIn ? "Iniciando..." : "Registrando...") 
                                : (isSignIn ? "Iniciar Sesión" : "Crear Cuenta")}
                        </Button>

                        <p className="text-center text-sm text-muted-foreground">
                            {isSignIn ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}
                            <Link
                                href={isSignIn ? "/sign-up" : "/sign-in"}
                                className="font-semibold text-primary hover:underline ml-1"
                            >
                                {isSignIn ? "Regístrate" : "Inicia sesión"}
                            </Link>
                        </p>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

export default AuthForm;