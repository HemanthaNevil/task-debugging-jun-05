import * as z from "zod"
import { toast } from "sonner"
import { useTranslation, Trans } from "react-i18next"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { PublicLayout } from "@/layouts/public-layout"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getAuthToken } from "@/lib/linkup"
import { countries, languages } from "@/config/app"
import { useAuthStore } from "@/stores/auth"
import { ButtonPopover } from "@/components/ui/button-popover"
import { QuestionMarkIcon } from "@radix-ui/react-icons"
import logo from "../../../assets/logo.png"
import { useEffect } from 'react';
import {
  getLocalStorageWindowMode,
  setWindowMode,
} from '@/lib/utils';

const formSchema = z.object({
  username: z.string().min(2).max(50),
  password: z.string().min(2).max(50),
  country: z.string().min(2).max(50),
  language: z.string().min(2).max(50),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const { i18n, t } = useTranslation()
  const setLanguage = useAuthStore((state) => state.setLanguage)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      country: "de",
      language: "en",
    },
  })

  const login = useAuthStore((state) => state.login)

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const authToken = await getAuthToken({
        country: values.country,
        username: values.username,
        password: values.password,
      })

      if (authToken) {
        login(authToken, values.country, values.language)
        navigate('/dashboard')
      } else {
        toast.error("Invalid credentials.")
      }
    } catch (error) {
      toast.error("Login failed. Please check your credentials and country.")
    }
  }

  const setAndRefreshLanguage = (l: string) => {
    i18n.changeLanguage(l)
    setLanguage(l)
  }

  // 👉 overlay mode
  // if it is in overlay mode automatically switch to windowed mode in this page
  useEffect(() => {
    const fetchWindowMode = async () => {
      const mode = await getLocalStorageWindowMode();

      if(mode != 'windowed'){
        setWindowMode('windowed');
      }

    };
    fetchWindowMode();
  }, []);

  return (
    <PublicLayout
      className="flex flex-col justify-center items-center"
    >
      <div className="flex flex-col items-center p-12">
        <h2 className="font-semibold text-2xl">Task Debugging</h2>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 w-full p-6"
        >
          <div className="flex flex-col justify-between ">
            <div className="grid grid-cols-2 gap-6 mt-6">
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{ t('Language')}</FormLabel>
                    <FormControl>
                      <Select onValueChange={(e) => {field.onChange(e);  setAndRefreshLanguage(e) }} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('SelectLanguage')} />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map(language => (
                            <SelectItem value={language.value} key={language.value}>
                              {t(language.label)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{ t('Country') }</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder={ t('SelectCountry') } />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map(country => (
                            <SelectItem value={country.value} key={country.value}>
                              { t(country.label) }
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{ t('Username')}</FormLabel>
                    <FormControl>
                      <Input placeholder={ t('Username') } {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{ t('Password') }</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={ t('Password') } {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-center mt-20">
              <Button type="submit" className="w-48">{ t('Login') }</Button>
            </div>
          </div>
        </form>
      </Form>
    </PublicLayout>
  )
}
